import { db } from '~/server/database/client'
import { schools } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.name) throw createError({ statusCode: 400, message: 'name is required' })
  const [school] = await db.insert(schools).values({
    name: body.name,
    address: body.address ?? null,
    phone: body.phone ?? null,
    email: body.email ?? null,
  }).returning()
  return school
})
