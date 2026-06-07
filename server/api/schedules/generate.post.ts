import { db } from '~/server/database/client'
import { sections, subjects, yearLevels, teacherSubjects, scheduleEntries, scheduleSets } from '~/server/database/schema'
import { eq, and } from 'drizzle-orm'
import {
  generateAllSchedules, buildFlagCeremonyEntries,
  generateTimeSlots, type SchedulerContext, type SubjectRequirement, type ScheduleEntry,
} from '~/server/utils/scheduler'

function toMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h! * 60 + m!
}

// Keep retrying until 0 shortfalls or this hard cap is hit.
// In practice 3 attempts is enough; cap prevents runaway on genuinely unsolvable configs.
const MAX_ATTEMPTS = 20

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { sectionIds, config, schoolYearId, scheduleName, scheduleSetId: existingSetId } = body

  if (!sectionIds?.length || !schoolYearId) {
    throw createError({ statusCode: 400, message: 'sectionIds and schoolYearId are required' })
  }

  // Resolve or create the schedule set
  let scheduleSetId: string
  if (existingSetId) {
    scheduleSetId = existingSetId as string
    for (const sid of sectionIds) {
      await db.delete(scheduleEntries)
        .where(and(eq(scheduleEntries.scheduleSetId, scheduleSetId), eq(scheduleEntries.sectionId, sid)))
    }
  } else {
    const [set] = await db.insert(scheduleSets).values({
      schoolYearId,
      name: scheduleName ?? `Schedule ${new Date().toLocaleString()}`,
    }).returning()
    scheduleSetId = set!.id
  }

  const params = {
    startTime: config?.startTime ?? '07:00',
    endTime: config?.endTime ?? '17:00',
    recessStart: config?.recessStart ?? '09:00',
    recessEnd: config?.recessEnd ?? '09:30',
    lunchStart: config?.lunchStart ?? '12:00',
    lunchEnd: config?.lunchEnd ?? '13:00',
    slotDurationMinutes: config?.slotDurationMinutes ?? 60,
    avoidConsecutiveSameSubject: config?.avoidConsecutiveSameSubject ?? true,
    extraBreaks: config?.extraBreaks ?? [],
    flagCeremony: config?.flagCeremony ?? { enabled: false, startTime: '07:00', endTime: '07:30', days: 'monday' },
    maxHoursPerTeacherPerDay: config?.maxHoursPerTeacherPerDay ?? 6,
  }

  const slots = generateTimeSlots(params)

  // Pre-load all section data and requirements once — reused across all retry attempts
  type SectionData = {
    section: { id: string; name: string; yearLevelId: number }
    requirements: SubjectRequirement[]
  }

  const sectionData: SectionData[] = []
  for (const sectionId of sectionIds) {
    const [section] = await db.select().from(sections).where(eq(sections.id, sectionId))
    if (!section) continue

    const [yearLevel] = await db.select().from(yearLevels).where(eq(yearLevels.id, section.yearLevelId))
    if (!yearLevel) continue

    const subjectList = await db.select().from(subjects)
      .where(eq(subjects.scheduleTypeId, yearLevel.scheduleTypeId))
      .all()

    const requirements = await Promise.all(subjectList.map(async (sub) => {
      const eligible = await db
        .select({ teacherId: teacherSubjects.teacherId, sectionCount: teacherSubjects.sectionCount })
        .from(teacherSubjects)
        .where(and(
          eq(teacherSubjects.subjectId, sub.id),
          eq(teacherSubjects.yearLevelId, section.yearLevelId),
        ))
        .all()
      return {
        subjectId: sub.id,
        subjectName: sub.name,
        yearLevelId: section.yearLevelId,
        hoursPerWeek: sub.hoursPerWeek,
        eligibleTeachers: eligible,
      } satisfies SubjectRequirement
    }))

    sectionData.push({ section, requirements })
  }

  // Run scheduling up to MAX_ATTEMPTS times (pure in-memory) and commit the best result.
  // Each attempt uses fresh randomness; the best (fewest shortfalls) is written to DB.
  type Shortfall = { sectionName: string; subject: string; needed: number; assigned: number }

  let bestEntries = new Map<string, ScheduleEntry[]>()
  let bestShortfalls: Shortfall[] = []
  let bestGenerated = 0
  let attemptsUsed = 0

  console.log(`[Sked] Generating schedule for ${sectionData.length} sections (max ${MAX_ATTEMPTS} attempts)`)

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    attemptsUsed = attempt + 1
    const ctx: SchedulerContext = {
      teacherSlots: new Map(),
      teacherSectionCounts: new Map(),
      teacherDayCounts: new Map(),
    }
    const attemptEntries = new Map<string, ScheduleEntry[]>()
    const attemptShortfalls: Shortfall[] = []
    let attemptGenerated = 0

    const sectionsForScheduler = sectionData.map(({ section, requirements }) => ({
      sectionId: section.id,
      requirements,
    }))
    const allEntriesMap = generateAllSchedules(sectionsForScheduler, params, ctx)

    for (const { section, requirements } of sectionData) {
      const entries = allEntriesMap.get(section.id) ?? []
      attemptEntries.set(section.id, entries)
      attemptGenerated += entries.length

      for (const req of requirements) {
        const got = entries.filter(e => e.subjectId === req.subjectId).length
        if (got < req.hoursPerWeek) {
          attemptShortfalls.push({
            sectionName: section.name,
            subject: req.subjectName,
            needed: req.hoursPerWeek,
            assigned: got,
          })
        }
      }
    }

    if (attempt === 0 || attemptShortfalls.length < bestShortfalls.length) {
      bestEntries = new Map(attemptEntries)
      bestShortfalls = attemptShortfalls
      bestGenerated = attemptGenerated
    }

    if (attemptShortfalls.length === 0) {
      console.log(`[Sked] Attempt ${attemptsUsed}/${MAX_ATTEMPTS}: ✓ PERFECT — ${attemptGenerated} slots placed`)
      break
    } else {
      const summary = attemptShortfalls.map(s => `${s.sectionName}/${s.subject} (${s.assigned}/${s.needed})`).join(', ')
      console.log(`[Sked] Attempt ${attemptsUsed}/${MAX_ATTEMPTS}: ${attemptShortfalls.length} shortfall(s) → ${summary}`)
    }
  }

  if (bestShortfalls.length > 0) {
    const summary = bestShortfalls.map(s => `${s.sectionName}/${s.subject} (${s.assigned}/${s.needed})`).join(', ')
    console.warn(`[Sked] Committed best result after ${attemptsUsed} attempts with ${bestShortfalls.length} unresolved shortfall(s): ${summary}`)
  } else {
    console.log(`[Sked] Schedule committed — ${bestGenerated} entries written`)
  }

  // Insert the best scheduling result into the DB
  let totalGenerated = 0
  for (const { section } of sectionData) {
    const entries = bestEntries.get(section.id) ?? []
    const fcEntries = params.flagCeremony.enabled
      ? buildFlagCeremonyEntries(section.id, slots, params.flagCeremony)
      : []

    const allEntries = [...fcEntries, ...entries]
    if (allEntries.length) {
      await db.insert(scheduleEntries).values(
        allEntries.map(e => ({ ...e, scheduleSetId })),
      )
      totalGenerated += entries.length
    }
  }

  // Insert break rows (recess, lunch, extra) as special entries for each section
  const breakRows: Array<typeof scheduleEntries.$inferInsert> = []
  for (const sectionId of sectionIds) {
    for (const day of [1, 2, 3, 4, 5]) {
      breakRows.push(
        { scheduleSetId, sectionId, subjectId: null, teacherId: null, dayOfWeek: day, slotStartTime: params.recessStart, slotEndTime: params.recessEnd, specialLabel: 'Health Break' },
        { scheduleSetId, sectionId, subjectId: null, teacherId: null, dayOfWeek: day, slotStartTime: params.lunchStart, slotEndTime: params.lunchEnd, specialLabel: 'Lunch Break' },
      )
    }
    for (const brk of params.extraBreaks) {
      const days = brk.days.length ? brk.days : [1, 2, 3, 4, 5]
      const brkStart = toMin(brk.startTime)
      const brkEnd = toMin(brk.endTime)
      // Split multi-slot breaks into individual slot-aligned entries so every
      // slot row within the range shows the label (not just the first one).
      const within = slots.filter(s => toMin(s.start) >= brkStart && toMin(s.end) <= brkEnd)
      for (const day of days) {
        if (within.length > 0) {
          for (const slot of within) {
            breakRows.push({ scheduleSetId, sectionId, subjectId: null, teacherId: null, dayOfWeek: day, slotStartTime: slot.start, slotEndTime: slot.end, specialLabel: brk.label || 'Break' })
          }
        } else {
          breakRows.push({ scheduleSetId, sectionId, subjectId: null, teacherId: null, dayOfWeek: day, slotStartTime: brk.startTime, slotEndTime: brk.endTime, specialLabel: brk.label || 'Break' })
        }
      }
    }
  }
  if (breakRows.length) {
    for (let i = 0; i < breakRows.length; i += 100) {
      await db.insert(scheduleEntries).values(breakRows.slice(i, i + 100))
    }
  }

  return { scheduleSetId, generated: totalGenerated, shortfalls: bestShortfalls, attemptsUsed }
})
