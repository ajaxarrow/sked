import { db } from '~/server/database/client'
import { scheduleSets } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await db.delete(scheduleSets).where(eq(scheduleSets.id, id))
  return { success: true }
})
