import { db } from '~/server/database/client'
import { subjects } from '~/server/database/schema'
import { eq } from 'drizzle-orm'
export default defineEventHandler(async (event) => {
  const { scheduleTypeId } = getQuery(event)
  if (!scheduleTypeId) throw createError({ statusCode: 400, message: 'scheduleTypeId required' })
  return db.select().from(subjects)
    .where(eq(subjects.scheduleTypeId, parseInt(scheduleTypeId as string)))
})
