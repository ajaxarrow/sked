import { db } from '~/server/database/client'
import { sections, teachers, yearLevels } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { schoolYearId } = getQuery(event)
  if (!schoolYearId) throw createError({ statusCode: 400, message: 'schoolYearId required' })

  return db
    .select({
      id: sections.id,
      schoolYearId: sections.schoolYearId,
      yearLevelId: sections.yearLevelId,
      name: sections.name,
      adviserId: sections.adviserId,
      adviserName: teachers.name,
      yearLevelName: yearLevels.name,
    })
    .from(sections)
    .leftJoin(teachers, eq(sections.adviserId, teachers.id))
    .leftJoin(yearLevels, eq(sections.yearLevelId, yearLevels.id))
    .where(eq(sections.schoolYearId, parseInt(schoolYearId as string)))
    .all()
})
