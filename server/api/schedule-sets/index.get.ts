import { db } from '~/server/database/client'
import { scheduleSets } from '~/server/database/schema'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { schoolYearId } = getQuery(event)
  if (!schoolYearId) throw createError({ statusCode: 400, message: 'schoolYearId required' })
  return db.select().from(scheduleSets)
    .where(eq(scheduleSets.schoolYearId, schoolYearId as string))
    .orderBy(desc(scheduleSets.createdAt))
    .all()
})
