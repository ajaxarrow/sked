import { db } from '~/server/database/client'
import { teachers } from '~/server/database/schema'
import { eq } from 'drizzle-orm'
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await db.delete(teachers).where(eq(teachers.id, id))
  return { success: true }
})
