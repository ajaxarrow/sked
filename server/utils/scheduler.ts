export interface TimeSlot {
  start: string
  end: string
}

export interface SchedulerParams {
  startTime: string
  endTime: string
  recessStart: string
  recessEnd: string
  lunchStart: string
  lunchEnd: string
  slotDurationMinutes: number
  avoidConsecutiveSameSubject: boolean
  extraBreaks: Array<{ startTime: string; endTime: string }>
}

export interface SubjectRequirement {
  subjectId: number
  subjectName: string
  hoursPerWeek: number
  eligibleTeacherIds: number[]
}

export interface ScheduleEntry {
  sectionId: number
  subjectId: number
  teacherId: number
  dayOfWeek: number // 1=Mon … 5=Fri
  slotStartTime: string
  slotEndTime: string
}

export interface SchedulerContext {
  // Key: `${teacherId}-${dayOfWeek}-${slotIdx}` → sectionId assigned there
  teacherSlots: Map<string, number>
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h! * 60 + m!
}

function fromMinutes(minutes: number): string {
  return `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`
}

export function generateTimeSlots(params: SchedulerParams): TimeSlot[] {
  const slots: TimeSlot[] = []
  const blocked: Array<[number, number]> = [
    [toMinutes(params.lunchStart), toMinutes(params.lunchEnd)],
    [toMinutes(params.recessStart), toMinutes(params.recessEnd)],
    ...params.extraBreaks.map(b => [toMinutes(b.startTime), toMinutes(b.endTime)] as [number, number]),
  ]

  let cur = toMinutes(params.startTime)
  const end = toMinutes(params.endTime)
  const dur = params.slotDurationMinutes

  while (cur + dur <= end) {
    const slotEnd = cur + dur
    const overlaps = blocked.some(([bs, be]) => cur < be && slotEnd > bs)
    if (!overlaps) slots.push({ start: fromMinutes(cur), end: fromMinutes(slotEnd) })
    cur += dur
  }

  return slots
}

export function generateSchedule(
  sectionId: number,
  requirements: SubjectRequirement[],
  params: SchedulerParams,
  ctx: SchedulerContext,
): ScheduleEntry[] {
  const slots = generateTimeSlots(params)
  const DAYS = [1, 2, 3, 4, 5] as const

  // section matrix: [dayIdx][slotIdx] → subjectId | null
  const matrix: Array<Array<number | null>> = DAYS.map(() => Array(slots.length).fill(null))
  const entries: ScheduleEntry[] = []

  // Sort hardest-to-place (most hours) first
  const sorted = [...requirements].sort((a, b) => b.hoursPerWeek - a.hoursPerWeek)

  for (const req of sorted) {
    let assigned = 0

    // Shuffle day order once per subject so assignments spread across the week
    const dayOrder = [...DAYS].sort(() => Math.random() - 0.5)

    // We try many times in case of collisions
    const maxAttempts = req.hoursPerWeek * 20
    for (let attempt = 0; attempt < maxAttempts && assigned < req.hoursPerWeek; attempt++) {
      const day = dayOrder[attempt % dayOrder.length]!
      const dayIdx = day - 1

      // Shuffle slots each attempt too, to avoid always filling 07:00 first
      const slotOrder = [...Array(slots.length).keys()].sort(() => Math.random() - 0.5)

      for (const slotIdx of slotOrder) {
        if (matrix[dayIdx][slotIdx] !== null) continue

        // Consecutive-same-subject constraint
        if (params.avoidConsecutiveSameSubject) {
          const prev = dayIdx - 1
          const next = dayIdx + 1
          if (prev >= 0 && matrix[prev][slotIdx] === req.subjectId) continue
          if (next < 5 && matrix[next][slotIdx] === req.subjectId) continue
        }

        // Find a free teacher for this slot
        const teacher = req.eligibleTeacherIds.find(
          tid => !ctx.teacherSlots.has(`${tid}-${day}-${slotIdx}`),
        )
        if (!teacher) continue

        // Assign
        matrix[dayIdx][slotIdx] = req.subjectId
        ctx.teacherSlots.set(`${teacher}-${day}-${slotIdx}`, sectionId)
        entries.push({
          sectionId,
          subjectId: req.subjectId,
          teacherId: teacher,
          dayOfWeek: day,
          slotStartTime: slots[slotIdx]!.start,
          slotEndTime: slots[slotIdx]!.end,
        })
        assigned++
        break
      }
    }
  }

  return entries
}
