import { db } from '~/server/database/client'
import { sections } from '~/server/database/schema'
import { eq } from 'drizzle-orm'
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await db.delete(sections).where(eq(sections.id, id))
  return { success: true }
})
