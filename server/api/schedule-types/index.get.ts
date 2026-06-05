import { db } from '~/server/database/client'
import { scheduleTypes } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { schoolId } = getQuery(event)
  if (!schoolId) throw createError({ statusCode: 400, message: 'schoolId required' })
  return db.select().from(scheduleTypes)
    .where(eq(scheduleTypes.schoolId, parseInt(schoolId as string)))
    .all()
})
