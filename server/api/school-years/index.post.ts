import { db } from '~/server/database/client'
import { schoolYears } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.schoolId || !body?.scheduleTypeId || !body?.label) {
    throw createError({ statusCode: 400, message: 'schoolId, scheduleTypeId, and label are required' })
  }
  const [year] = await db.insert(schoolYears).values({
    schoolId: body.schoolId,
    scheduleTypeId: body.scheduleTypeId,
    label: body.label,
    isActive: body.isActive ?? true,
  }).returning()
  return year
})
