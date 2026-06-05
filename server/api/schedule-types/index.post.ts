import { db } from '~/server/database/client'
import { scheduleTypes } from '~/server/database/schema'
import { seedJHS } from '~/server/database/seed'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.schoolId || !body?.name) {
    throw createError({ statusCode: 400, message: 'schoolId and name are required' })
  }
  const [type] = await db.insert(scheduleTypes)
    .values({ schoolId: body.schoolId, name: body.name })
    .returning()
  if (body.name === 'Junior High School') {
    await seedJHS(db, type!.id)
  }
  return type
})
