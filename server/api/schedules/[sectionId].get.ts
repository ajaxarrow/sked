import { db } from '~/server/database/client'
import { scheduleEntries, subjects, teachers } from '~/server/database/schema'
import { eq, and, notInArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const sectionId = parseInt(getRouterParam(event, 'sectionId')!)

  const entries = await db
    .select({
      id: scheduleEntries.id,
      sectionId: scheduleEntries.sectionId,
      subjectId: scheduleEntries.subjectId,
      teacherId: scheduleEntries.teacherId,
      dayOfWeek: scheduleEntries.dayOfWeek,
      slotStartTime: scheduleEntries.slotStartTime,
      slotEndTime: scheduleEntries.slotEndTime,
      subjectName: subjects.name,
      subjectColor: subjects.colorHex,
      teacherName: teachers.name,
    })
    .from(scheduleEntries)
    .innerJoin(subjects, eq(scheduleEntries.subjectId, subjects.id))
    .innerJoin(teachers, eq(scheduleEntries.teacherId, teachers.id))
    .where(eq(scheduleEntries.sectionId, sectionId))
    .all()

  // Build vacant-teacher map: for each time slot, list teachers with no assignment
  const allTeachers = await db.select({ id: teachers.id, name: teachers.name }).from(teachers).all()

  const slotKeys = [...new Set(entries.map(e => `${e.dayOfWeek}-${e.slotStartTime}`))]
  const slotVacancies: Record<string, Array<{ teacherId: number; teacherName: string }>> = {}

  for (const key of slotKeys) {
    const [day, start] = key.split('-', 2) as [string, string]
    const busyIds = await db
      .select({ teacherId: scheduleEntries.teacherId })
      .from(scheduleEntries)
      .where(and(
        eq(scheduleEntries.dayOfWeek, parseInt(day)),
        eq(scheduleEntries.slotStartTime, start),
      ))
      .all()
    const busySet = new Set(busyIds.map(b => b.teacherId))
    slotVacancies[key] = allTeachers
      .filter(t => !busySet.has(t.id))
      .map(t => ({ teacherId: t.id, teacherName: t.name }))
  }

  return { entries, slotVacancies }
})
