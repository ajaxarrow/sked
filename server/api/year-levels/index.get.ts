import { db } from '~/server/database/client'
import { yearLevels } from '~/server/database/schema'
import { eq, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { scheduleTypeId } = getQuery(event)
  if (!scheduleTypeId) throw createError({ statusCode: 400, message: 'scheduleTypeId required' })
  return db.select().from(yearLevels)
    .where(eq(yearLevels.scheduleTypeId, parseInt(scheduleTypeId as string)))
    .orderBy(asc(yearLevels.sortOrder))
    .all()
})
