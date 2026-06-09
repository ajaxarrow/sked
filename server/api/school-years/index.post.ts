import { db } from '~/server/database/client'
import { schoolYears, scheduleTypes } from '~/server/database/schema'
import { seedJHS, seedSHS } from '~/server/database/seed'
import { eq, and, isNull } from 'drizzle-orm'

const LEVEL_TYPES = ['Junior High School', 'Senior High School'] as const

function buildLabel(startYear: number, endYear: number, semester?: string | null) {
  const base = `${startYear}-${endYear}`
  return semester ? `${base} · ${semester}` : base
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.schoolId || !body?.levelType || !body?.startYear || !body?.endYear) {
    throw createError({ statusCode: 400, message: 'schoolId, levelType, startYear, and endYear are required' })
  }
  if (!(LEVEL_TYPES as readonly string[]).includes(body.levelType)) {
    throw createError({ statusCode: 400, message: 'levelType must be Junior High School or Senior High School' })
  }
  if (body.startYear >= body.endYear) {
    throw createError({ statusCode: 400, message: 'endYear must be greater than startYear' })
  }
  if (body.levelType === 'Senior High School' && !body.semester) {
    throw createError({ statusCode: 400, message: 'semester is required for Senior High School' })
  }

  const semester: string | null = body.semester ?? null

  // Find or create the schedule type for this school + level
  const existingTypes = await db.select().from(scheduleTypes)
    .where(and(eq(scheduleTypes.schoolId, body.schoolId), eq(scheduleTypes.name, body.levelType)))

  let typeId: number
  if (existingTypes.length > 0) {
    typeId = existingTypes[0]!.id
  } else {
    const [newType] = await db.insert(scheduleTypes)
      .values({ schoolId: body.schoolId, name: body.levelType })
      .returning()
    typeId = newType!.id
    if (body.levelType === 'Junior High School') {
      await seedJHS(db, typeId)
    } else {
      await seedSHS(db, typeId)
    }
  }

  // Duplicate check: same school + type + startYear + endYear + semester
  const duplicateCheck = await db.select().from(schoolYears)
    .where(and(
      eq(schoolYears.schoolId, body.schoolId),
      eq(schoolYears.scheduleTypeId, typeId),
      eq(schoolYears.startYear, body.startYear),
      eq(schoolYears.endYear, body.endYear),
      semester ? eq(schoolYears.semester, semester) : isNull(schoolYears.semester),
    ))
  if (duplicateCheck.length > 0) {
    throw createError({
      statusCode: 409,
      message: `Academic year ${buildLabel(body.startYear, body.endYear, semester)} already exists for this level.`,
    })
  }

  const label = buildLabel(body.startYear, body.endYear, semester)

  const [year] = await db.insert(schoolYears).values({
    schoolId: body.schoolId,
    scheduleTypeId: typeId,
    label,
    startYear: body.startYear,
    endYear: body.endYear,
    semester,
    isActive: body.isActive ?? true,
  }).returning()
  return year
})
