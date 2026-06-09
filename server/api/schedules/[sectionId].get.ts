import { db } from '~/server/database/client'
import { scheduleEntries, subjects, teachers, scheduleSets } from '~/server/database/schema'
import { eq, and, desc } from 'drizzle-orm'
export default defineEventHandler(async (event) => {
  const sectionId = getRouterParam(event, 'sectionId')!
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
    return { entries: [], slotVacancies: {} }
  }
  const entries = await db
    .select({
      id: scheduleEntries.id,
      scheduleSetId: scheduleEntries.scheduleSetId,
      sectionId: scheduleEntries.sectionId,
      subjectId: scheduleEntries.subjectId,
      teacherId: scheduleEntries.teacherId,
      dayOfWeek: scheduleEntries.dayOfWeek,
      slotStartTime: scheduleEntries.slotStartTime,
      slotEndTime: scheduleEntries.slotEndTime,
      subjectName: subjects.name,
      subjectColor: subjects.colorHex,
      teacherName: teachers.name,
      teacherColor: teachers.colorHex,
      specialLabel: scheduleEntries.specialLabel,
    })
    .from(scheduleEntries)
    .leftJoin(subjects, eq(scheduleEntries.subjectId, subjects.id))
    .leftJoin(teachers, eq(scheduleEntries.teacherId, teachers.id))
    .where(and(
      eq(scheduleEntries.sectionId, sectionId),
      eq(scheduleEntries.scheduleSetId, scheduleSetId),
    ))
  const allTeachers = await db.select({ id: teachers.id, name: teachers.name }).from(teachers)
  const slotKeys = [...new Set(
    entries.filter(e => !e.specialLabel).map(e => `${e.dayOfWeek}-${e.slotStartTime}`)
  )]
  const slotVacancies: Record<string, Array<{ teacherId: string; teacherName: string }>> = {}
  for (const key of slotKeys) {
    const [dayStr, start] = key.split('-', 2) as [string, string]
    const busyIds = await db
      .select({ teacherId: scheduleEntries.teacherId })
      .from(scheduleEntries)
      .where(and(
        eq(scheduleEntries.scheduleSetId, scheduleSetId),
        eq(scheduleEntries.dayOfWeek, parseInt(dayStr)),
        eq(scheduleEntries.slotStartTime, start),
      ))
    const busySet = new Set(busyIds.map(b => b.teacherId).filter(Boolean))
    slotVacancies[key] = allTeachers
      .filter(t => !busySet.has(t.id))
      .map(t => ({ teacherId: t.id, teacherName: t.name }))
  }
  return { entries, slotVacancies, scheduleSetId }
})
