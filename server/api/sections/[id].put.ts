import { db } from '~/server/database/client'
import { sections } from '~/server/database/schema'
import { eq } from 'drizzle-orm'
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const [updated] = await db.update(sections)
    .set({ name: body.name, adviserId: body.adviserId ?? null, yearLevelId: body.yearLevelId })
    .where(eq(sections.id, id))
    .returning()
  if (!updated) throw createError({ statusCode: 404, message: 'Section not found' })
  return updated
})
