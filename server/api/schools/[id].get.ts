import { db } from '~/server/database/client'
import { schools } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const [school] = await db.select().from(schools).where(eq(schools.id, id))
  if (!school) throw createError({ statusCode: 404, message: 'School not found' })
  return school
})
