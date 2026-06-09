import { db } from '~/server/database/client'
import { teachers, teacherSubjects, subjects, yearLevels } from '~/server/database/schema'
import { eq } from 'drizzle-orm'
export default defineEventHandler(async (event) => {
  const { schoolId } = getQuery(event)
  if (!schoolId) throw createError({ statusCode: 400, message: 'schoolId required' })
  const teacherList = await db.select().from(teachers)
    .where(eq(teachers.schoolId, schoolId as string))
  const withSubjects = await Promise.all(teacherList.map(async (t) => {
    const assignments = await db
      .select({
        id: teacherSubjects.id,
        teacherId: teacherSubjects.teacherId,
        subjectId: teacherSubjects.subjectId,
        yearLevelId: teacherSubjects.yearLevelId,
        sectionCount: teacherSubjects.sectionCount,
        subjectName: subjects.name,
        subjectColor: subjects.colorHex,
        yearLevelName: yearLevels.name,
      })
      .from(teacherSubjects)
      .innerJoin(subjects, eq(teacherSubjects.subjectId, subjects.id))
      .innerJoin(yearLevels, eq(teacherSubjects.yearLevelId, yearLevels.id))
      .where(eq(teacherSubjects.teacherId, t.id))
    return { ...t, subjects: assignments }
  }))
  return withSubjects
})
