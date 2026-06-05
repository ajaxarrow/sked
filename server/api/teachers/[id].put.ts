import { db } from '~/server/database/client'
import { teachers, teacherSubjects } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id')!)
  const body = await readBody(event)

  const [updated] = await db.update(teachers).set({
    name: body.name,
    maxHoursPerWeek: body.maxHoursPerWeek,
    maxHoursPerDay: body.maxHoursPerDay,
  }).where(eq(teachers.id, id)).returning()

  if (!updated) throw createError({ statusCode: 404, message: 'Teacher not found' })

  await db.delete(teacherSubjects).where(eq(teacherSubjects.teacherId, id))
  if (body.assignments?.length) {
    await db.insert(teacherSubjects).values(
      body.assignments.map((a: { subjectId: number; yearLevelId: number }) => ({
        teacherId: id,
        subjectId: a.subjectId,
        yearLevelId: a.yearLevelId,
      })),
    )
  }

  return updated
})
