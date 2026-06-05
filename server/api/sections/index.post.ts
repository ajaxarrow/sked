import { db } from '~/server/database/client'
import { sections } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.schoolYearId || !body?.yearLevelId || !body?.name) {
    throw createError({ statusCode: 400, message: 'schoolYearId, yearLevelId, name required' })
  }
  const [section] = await db.insert(sections).values({
    schoolYearId: body.schoolYearId,
    yearLevelId: body.yearLevelId,
    name: body.name,
    adviserId: body.adviserId ?? null,
  }).returning()
  return section
})
