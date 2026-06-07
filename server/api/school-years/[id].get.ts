import { db } from '~/server/database/client'
import { schoolYears } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const [year] = await db.select().from(schoolYears).where(eq(schoolYears.id, id))
  if (!year) throw createError({ statusCode: 404, message: 'School year not found' })
  return year
})
