import { db } from '~/server/database/client'
import { subjects } from '~/server/database/schema'
import { eq } from 'drizzle-orm'
export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id')!)
  const body = await readBody(event)
  const [updated] = await db.update(subjects)
    .set({ name: body.name, hoursPerWeek: body.hoursPerWeek, colorHex: body.colorHex })
    .where(eq(subjects.id, id))
    .returning()
  if (!updated) throw createError({ statusCode: 404, message: 'Subject not found' })
  return updated
})
