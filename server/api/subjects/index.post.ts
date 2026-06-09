import { db } from '~/server/database/client'
import { subjects } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.scheduleTypeId || !body?.name) {
    throw createError({ statusCode: 400, message: 'scheduleTypeId and name are required' })
  }
  const [subject] = await db.insert(subjects).values({
    scheduleTypeId: body.scheduleTypeId,
    name: body.name,
    hoursPerWeek: body.hoursPerWeek ?? 4,
    colorHex: body.colorHex ?? '#6366f1',
  }).returning()
  return subject
})
