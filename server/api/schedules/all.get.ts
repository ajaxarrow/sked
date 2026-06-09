import { db } from '~/server/database/client'
import { scheduleEntries, subjects, teachers, sections, yearLevels, scheduleSets } from '~/server/database/schema'
import { eq, and, desc } from 'drizzle-orm'
export default defineEventHandler(async (event) => {
  const { schoolYearId, scheduleSetId: setIdParam } = getQuery(event)
  if (!schoolYearId) {
    throw createError({ statusCode: 400, message: 'schoolYearId required' })
  }
  let scheduleSetId: string | null = null
  if (setIdParam) {
    scheduleSetId = setIdParam as string
  } else {
    const [latest] = await db.select().from(scheduleSets)
      .where(eq(scheduleSets.schoolYearId, schoolYearId as string))
      .orderBy(desc(scheduleSets.createdAt))
      .limit(1)
    scheduleSetId = latest?.id ?? null
  }
  if (!scheduleSetId) {
    return { sections: [], entries: [], scheduleSetId: null }
  }
  const allSections = await db
    .select({
      id: sections.id,
      schoolYearId: sections.schoolYearId,
      yearLevelId: sections.yearLevelId,
      name: sections.name,
      adviserId: sections.adviserId,
      yearLevelName: yearLevels.name,
      sortOrder: yearLevels.sortOrder,
    })
    .from(sections)
    .leftJoin(yearLevels, eq(sections.yearLevelId, yearLevels.id))
    .where(eq(sections.schoolYearId, schoolYearId as string))
    .orderBy(yearLevels.sortOrder, sections.name)
  const allEntries = await db
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
    .where(eq(scheduleEntries.scheduleSetId, scheduleSetId))
  return { sections: allSections, entries: allEntries, scheduleSetId }
})
