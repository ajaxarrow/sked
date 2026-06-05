import { db } from '~/server/database/client'
import { teachers, teacherSubjects } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.schoolId || !body?.name) {
    throw createError({ statusCode: 400, message: 'schoolId and name are required' })
  }
  const [teacher] = await db.insert(teachers).values({
    schoolId: body.schoolId,
    name: body.name,
    maxHoursPerWeek: body.maxHoursPerWeek ?? 40,
    maxHoursPerDay: body.maxHoursPerDay ?? 8,
  }).returning()

  if (body.assignments?.length) {
    await db.insert(teacherSubjects).values(
      body.assignments.map((a: { subjectId: number; yearLevelId: number }) => ({
        teacherId: teacher!.id,
        subjectId: a.subjectId,
        yearLevelId: a.yearLevelId,
      })),
    )
  }

  return teacher
})
