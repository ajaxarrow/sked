import { db } from '~/server/database/client'
import { scheduleSets } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.schoolYearId || !body?.name) {
    throw createError({ statusCode: 400, message: 'schoolYearId and name are required' })
  }
  const [set] = await db.insert(scheduleSets).values({
    schoolYearId: body.schoolYearId,
    name: body.name,
  }).returning()
  return set
})
