import { db } from '~/server/database/client'
import { teachers, teacherSubjects, subjects, yearLevels } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id))
  if (!teacher) throw createError({ statusCode: 404, message: 'Teacher not found' })

  const assignments = await db
    .select({
      id: teacherSubjects.id,
      teacherId: teacherSubjects.teacherId,
      subjectId: teacherSubjects.subjectId,
      yearLevelId: teacherSubjects.yearLevelId,
      sectionCount: teacherSubjects.sectionCount,
      subjectName: subjects.name,
      yearLevelName: yearLevels.name,
    })
    .from(teacherSubjects)
    .innerJoin(subjects, eq(teacherSubjects.subjectId, subjects.id))
    .innerJoin(yearLevels, eq(teacherSubjects.yearLevelId, yearLevels.id))
    .where(eq(teacherSubjects.teacherId, id))
    .all()

  return { ...teacher, subjects: assignments }
})
