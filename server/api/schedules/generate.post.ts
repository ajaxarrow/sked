import { db } from '~/server/database/client'
import { sections, subjects, yearLevels, teacherSubjects, scheduleEntries } from '~/server/database/schema'
import { eq } from 'drizzle-orm'
import { generateSchedule, type SchedulerContext } from '~/server/utils/scheduler'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.sectionIds?.length) {
    throw createError({ statusCode: 400, message: 'sectionIds required' })
  }

  const ctx: SchedulerContext = { teacherSlots: new Map() }
  let totalGenerated = 0

  for (const sectionId of body.sectionIds) {
    const [section] = await db.select().from(sections).where(eq(sections.id, sectionId))
    if (!section) continue

    const [yearLevel] = await db.select().from(yearLevels).where(eq(yearLevels.id, section.yearLevelId))
    if (!yearLevel) continue

    const subjectList = await db.select().from(subjects)
      .where(eq(subjects.scheduleTypeId, yearLevel.scheduleTypeId))
      .all()

    const requirements = await Promise.all(subjectList.map(async (sub) => {
      const eligible = await db
        .select({ teacherId: teacherSubjects.teacherId })
        .from(teacherSubjects)
        .where(eq(teacherSubjects.subjectId, sub.id))
        .all()
      return {
        subjectId: sub.id,
        subjectName: sub.name,
        hoursPerWeek: sub.hoursPerWeek,
        eligibleTeacherIds: eligible.map(e => e.teacherId),
      }
    }))

    const params = {
      startTime: body.config?.startTime ?? '07:00',
      endTime: body.config?.endTime ?? '17:00',
      recessStart: body.config?.recessStart ?? '09:00',
      recessEnd: body.config?.recessEnd ?? '09:15',
      lunchStart: body.config?.lunchStart ?? '12:00',
      lunchEnd: body.config?.lunchEnd ?? '13:00',
      slotDurationMinutes: body.config?.slotDurationMinutes ?? 60,
      avoidConsecutiveSameSubject: body.config?.avoidConsecutiveSameSubject ?? true,
      extraBreaks: body.config?.extraBreaks ?? [],
    }

    await db.delete(scheduleEntries).where(eq(scheduleEntries.sectionId, sectionId))

    const entries = generateSchedule(sectionId, requirements, params, ctx)

    if (entries.length) {
      await db.insert(scheduleEntries).values(entries)
      totalGenerated += entries.length
    }
  }

  return { generated: totalGenerated }
})
