import { db } from '~/server/database/client'
import { schoolYears } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { schoolId } = getQuery(event)
  if (!schoolId) throw createError({ statusCode: 400, message: 'schoolId required' })
  return db.select().from(schoolYears)
    .where(eq(schoolYears.schoolId, parseInt(schoolId as string)))
    .all()
})
