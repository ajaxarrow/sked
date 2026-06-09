import { db } from '~/server/database/client'
import { schools } from '~/server/database/schema'
import { eq } from 'drizzle-orm'
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const [updated] = await db.update(schools)
    .set({ name: body.name, address: body.address, phone: body.phone, email: body.email })
    .where(eq(schools.id, id))
    .returning()
  if (!updated) throw createError({ statusCode: 404, message: 'School not found' })
  return updated
})
