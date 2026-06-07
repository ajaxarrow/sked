import { db } from '~/server/database/client'
import { scheduleEntries, subjects, sections, yearLevels, teachers, scheduleSets } from '~/server/database/schema'
import { eq, and, isNotNull, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const teacherId = getRouterParam(event, 'teacherId')!
  const { scheduleSetId: setIdParam, schoolYearId } = getQuery(event)

  let scheduleSetId: string | null = null
  if (setIdParam) {
    scheduleSetId = setIdParam as string
  } else if (schoolYearId) {
    const [latest] = await db.select().from(scheduleSets)
      .where(eq(scheduleSets.schoolYearId, schoolYearId as string))
      .orderBy(desc(scheduleSets.createdAt))
      .limit(1)
    scheduleSetId = latest?.id ?? null
  }

  if (!scheduleSetId) {
    return { teacher: null, teachingEntries: [], specialSlots: [], allSlotTimes: [] }
  }

  const [teacher] = await db
    .select({ id: teachers.id, name: teachers.name, maxHoursPerWeek: teachers.maxHoursPerWeek, maxHoursPerDay: teachers.maxHoursPerDay })
    .from(teachers)
    .where(eq(teachers.id, teacherId))
    .limit(1)

  if (!teacher) throw createError({ statusCode: 404, message: 'Teacher not found' })

  // This teacher's teaching entries (non-special only)
  const teachingEntries = await db
    .select({
      sectionId: scheduleEntries.sectionId,
      dayOfWeek: scheduleEntries.dayOfWeek,
      slotStartTime: scheduleEntries.slotStartTime,
      slotEndTime: scheduleEntries.slotEndTime,
      subjectName: subjects.name,
      subjectColor: subjects.colorHex,
      sectionName: sections.name,
      sectionYearLevel: yearLevels.name,
    })
    .from(scheduleEntries)
    .leftJoin(subjects, eq(scheduleEntries.subjectId, subjects.id))
    .leftJoin(sections, eq(scheduleEntries.sectionId, sections.id))
    .leftJoin(yearLevels, eq(sections.yearLevelId, yearLevels.id))
    .where(and(
      eq(scheduleEntries.scheduleSetId, scheduleSetId),
      eq(scheduleEntries.teacherId, teacherId),
    ))
    .all()

  // Special/break slots deduplicated by day+startTime
  const rawSpecial = await db
    .select({
      dayOfWeek: scheduleEntries.dayOfWeek,
      slotStartTime: scheduleEntries.slotStartTime,
      slotEndTime: scheduleEntries.slotEndTime,
      specialLabel: scheduleEntries.specialLabel,
    })
    .from(scheduleEntries)
    .where(and(
      eq(scheduleEntries.scheduleSetId, scheduleSetId),
      isNotNull(scheduleEntries.specialLabel),
    ))
    .all()

  const specialMap = new Map<string, typeof rawSpecial[0]>()
  for (const s of rawSpecial) {
    const key = `${s.dayOfWeek}-${s.slotStartTime}`
    if (!specialMap.has(key)) specialMap.set(key, s)
  }

  // All unique slot times in the schedule
  const rawSlots = await db
    .select({ slotStartTime: scheduleEntries.slotStartTime, slotEndTime: scheduleEntries.slotEndTime })
    .from(scheduleEntries)
    .where(eq(scheduleEntries.scheduleSetId, scheduleSetId))
    .all()

  const slotMap = new Map<string, { slotStartTime: string; slotEndTime: string }>()
  for (const e of rawSlots) {
    if (!slotMap.has(e.slotStartTime)) slotMap.set(e.slotStartTime, e)
  }

  return {
    teacher,
    teachingEntries,
    specialSlots: [...specialMap.values()],
    allSlotTimes: [...slotMap.values()].sort((a, b) => a.slotStartTime.localeCompare(b.slotStartTime)),
  }
})
