import { db } from '~/server/database/client'
import { sections, teachers, yearLevels } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id')!)
  const [section] = await db
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
    .where(eq(sections.id, id))
  if (!section) throw createError({ statusCode: 404, message: 'Section not found' })
  return section
})
