import { db } from '~/server/database/client'
import { subjects } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id')!)
  await db.delete(subjects).where(eq(subjects.id, id))
  return { success: true }
})
