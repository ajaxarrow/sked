import { db } from '~/server/database/client'
import { scheduleEntries, subjects, teachers } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export interface SwapSlotInfo {
  dayOfWeek: number
  slotStartTime: string
  slotEndTime: string
  subjectName: string | null
  subjectColor: string | null
  teacherName: string | null
  teacherId: string | null
}

export interface TwoWaySwap {
  type: '2way'
  target: SwapSlotInfo
  sameTeacher: boolean
}

export interface ThreeWaySwap {
  type: '3way'
  // After swap: source moves to `target` time, `through` moves to `displaced` time, `displaced` moves to source's original time
  target: SwapSlotInfo    // where the source will land
  through: SwapSlotInfo   // the intermediate entry (currently at target's time)
  displaced: SwapSlotInfo // the third entry that gets pushed to source's original time
}

function slotDuration(start: string, end: string): number {
  const [sh = 0, sm = 0] = start.split(':').map(Number)
  const [eh = 0, em = 0] = end.split(':').map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

export default defineEventHandler(async (event) => {
  const { scheduleSetId, sectionId, sourceDayOfWeek, sourceSlotStartTime } = await readBody(event)

  if (!scheduleSetId || !sectionId || !sourceDayOfWeek || !sourceSlotStartTime) {
    throw createError({ statusCode: 400, message: 'scheduleSetId, sectionId, sourceDayOfWeek, sourceSlotStartTime are required' })
  }

  // Fetch all entries for this schedule set (needed for cross-section teacher conflict checks)
  const all = await db
    .select({
      id:            scheduleEntries.id,
      sectionId:     scheduleEntries.sectionId,
      teacherId:     scheduleEntries.teacherId,
      subjectId:     scheduleEntries.subjectId,
      dayOfWeek:     scheduleEntries.dayOfWeek,
      slotStartTime: scheduleEntries.slotStartTime,
      slotEndTime:   scheduleEntries.slotEndTime,
      specialLabel:  scheduleEntries.specialLabel,
      subjectName:   subjects.name,
      subjectColor:  subjects.colorHex,
      teacherName:   teachers.name,
    })
    .from(scheduleEntries)
    .leftJoin(subjects,  eq(scheduleEntries.subjectId,  subjects.id))
    .leftJoin(teachers,  eq(scheduleEntries.teacherId,  teachers.id))
    .where(eq(scheduleEntries.scheduleSetId, scheduleSetId))
    .all()

  // Only subject entries (no breaks)
  const subjectAll = all.filter(e => !e.specialLabel)

  // Source entry
  const source = subjectAll.find(
    e => e.sectionId === sectionId &&
         e.dayOfWeek === sourceDayOfWeek &&
         e.slotStartTime === sourceSlotStartTime,
  )
  if (!source) {
    throw createError({ statusCode: 404, message: 'Source slot not found or is a break/special' })
  }

  // Subject entries for this section only (candidates to swap with)
  const sectionSubjectEntries = subjectAll.filter(e => e.sectionId === sectionId)

  // Candidates: every subject slot in this section except the source
  const candidates = sectionSubjectEntries.filter(
    e => !(e.dayOfWeek === source.dayOfWeek && e.slotStartTime === source.slotStartTime),
  )

  // Teacher busy map: `teacherId|day|slotStart` → Set of sectionIds currently teaching
  const teacherBusy = new Map<string, Set<string>>()
  for (const e of subjectAll) {
    if (!e.teacherId) continue
    const k = `${e.teacherId}|${e.dayOfWeek}|${e.slotStartTime}`
    if (!teacherBusy.has(k)) teacherBusy.set(k, new Set())
    teacherBusy.get(k)!.add(e.sectionId)
  }

  /**
   * Returns true if `teacherId` has no assignment at (day, slotStart) in any
   * section OTHER than `excludeSectionId`.  We exclude our own section because
   * the swap only moves entries within it, so the existing in-section assignment
   * at the target time is the one being displaced, not a conflict.
   */
  function isFree(teacherId: string | null, day: number, slotStart: string): boolean {
    if (!teacherId) return true
    const k = `${teacherId}|${day}|${slotStart}`
    const secs = teacherBusy.get(k)
    if (!secs) return true
    return [...secs].every(s => s === sectionId)
  }

  const sourceDur = slotDuration(source.slotStartTime, source.slotEndTime)

  // ── 2-way swaps ────────────────────────────────────────────────────────────
  const twoWay: TwoWaySwap[] = []

  for (const c of candidates) {
    // Require same slot duration so hours don't shift
    if (slotDuration(c.slotStartTime, c.slotEndTime) !== sourceDur) continue

    const sameTeacher = !!source.teacherId && source.teacherId === c.teacherId
    const sameSubject = source.subjectId === c.subjectId

    // Same teacher + same subject → swapping changes nothing, skip
    if (sameTeacher && sameSubject) continue

    if (
      sameTeacher ||
      (isFree(source.teacherId, c.dayOfWeek, c.slotStartTime) &&
       isFree(c.teacherId, source.dayOfWeek, source.slotStartTime))
    ) {
      twoWay.push({
        type: '2way',
        sameTeacher,
        target: {
          dayOfWeek:     c.dayOfWeek,
          slotStartTime: c.slotStartTime,
          slotEndTime:   c.slotEndTime,
          subjectName:   c.subjectName,
          subjectColor:  c.subjectColor,
          teacherName:   c.teacherName,
          teacherId:     c.teacherId,
        },
      })
    }
  }

  // ── 3-way swaps ────────────────────────────────────────────────────────────
  // Pattern: source → B's time, B → C's time, C → source's time
  // Conditions:
  //   source.teacher free at B's time (other sections)
  //   B.teacher     free at C's time (other sections)
  //   C.teacher     free at source's time (other sections)
  //
  // Only look for 3-way if this B is NOT already a valid 2-way target.

  const twoWayKeys = new Set(twoWay.map(s => `${s.target.dayOfWeek}|${s.target.slotStartTime}`))
  const threeWay: ThreeWaySwap[] = []
  const threeWayTargetKeys = new Set<string>() // deduplicate by target position

  for (const b of candidates) {
    if (slotDuration(b.slotStartTime, b.slotEndTime) !== sourceDur) continue
    // Skip if already reachable via 2-way
    if (twoWayKeys.has(`${b.dayOfWeek}|${b.slotStartTime}`)) continue
    // Same teacher + same subject as source → pointless rotation leg
    if (source.teacherId && source.teacherId === b.teacherId && source.subjectId === b.subjectId) continue

    // source must be able to move to B's slot
    const sourceCanGoToB =
      (!!source.teacherId && source.teacherId === b.teacherId) ||
      isFree(source.teacherId, b.dayOfWeek, b.slotStartTime)

    if (!sourceCanGoToB) continue

    // Find a C (≠ source, ≠ B) to complete the rotation
    for (const c of candidates) {
      if (c.dayOfWeek === b.dayOfWeek && c.slotStartTime === b.slotStartTime) continue
      if (slotDuration(c.slotStartTime, c.slotEndTime) !== sourceDur) continue

      const bKey = `${b.dayOfWeek}|${b.slotStartTime}`
      if (threeWayTargetKeys.has(bKey)) break // already have a 3-way to this position

      // B must be able to move to C's slot
      const bCanGoToC =
        (!!b.teacherId && b.teacherId === c.teacherId) ||
        isFree(b.teacherId, c.dayOfWeek, c.slotStartTime)

      // C must be able to move to source's slot
      const cCanGoToSource =
        (!!c.teacherId && c.teacherId === source.teacherId) ||
        isFree(c.teacherId, source.dayOfWeek, source.slotStartTime)

      if (bCanGoToC && cCanGoToSource) {
        threeWayTargetKeys.add(bKey)
        threeWay.push({
          type:      '3way',
          target:    { dayOfWeek: b.dayOfWeek, slotStartTime: b.slotStartTime, slotEndTime: b.slotEndTime, subjectName: b.subjectName, subjectColor: b.subjectColor, teacherName: b.teacherName, teacherId: b.teacherId },
          through:   { dayOfWeek: b.dayOfWeek, slotStartTime: b.slotStartTime, slotEndTime: b.slotEndTime, subjectName: b.subjectName, subjectColor: b.subjectColor, teacherName: b.teacherName, teacherId: b.teacherId },
          displaced: { dayOfWeek: c.dayOfWeek, slotStartTime: c.slotStartTime, slotEndTime: c.slotEndTime, subjectName: c.subjectName, subjectColor: c.subjectColor, teacherName: c.teacherName, teacherId: c.teacherId },
        })
        break
      }
    }

    if (threeWay.length >= 12) break // cap results
  }

  return {
    source: {
      dayOfWeek:     source.dayOfWeek,
      slotStartTime: source.slotStartTime,
      slotEndTime:   source.slotEndTime,
      subjectName:   source.subjectName,
      subjectColor:  source.subjectColor,
      teacherName:   source.teacherName,
      teacherId:     source.teacherId,
    } as SwapSlotInfo,
    twoWaySwaps:   twoWay,
    threeWaySwaps: threeWay,
  }
})
