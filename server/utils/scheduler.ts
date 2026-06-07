export interface TimeSlot {
  start: string
  end: string
}

export interface FlagCeremonyConfig {
  enabled: boolean
  startTime: string
  endTime: string
  days: 'everyday' | 'monday' | number[]
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
  extraBreaks: Array<{ label: string; startTime: string; endTime: string; days: number[] }>
  flagCeremony?: FlagCeremonyConfig
  maxHoursPerTeacherPerDay?: number
  adviserFirstSlot?: boolean
}

export interface SubjectRequirement {
  subjectId: number
  subjectName: string
  yearLevelId: number
  hoursPerWeek: number
  eligibleTeachers: Array<{ teacherId: string; sectionCount: number }>
}

export interface ScheduleEntry {
  sectionId: string
  subjectId: number | null
  teacherId: string | null
  dayOfWeek: number
  slotStartTime: string
  slotEndTime: string
  specialLabel: string | null
}

export interface SchedulerContext {
  teacherSlots: Map<string, string>
  teacherSectionCounts: Map<string, number>
  teacherDayCounts: Map<string, number>
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h! * 60 + m!
}

function fromMinutes(minutes: number): string {
  return `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`
}

export function generateTimeSlots(params: SchedulerParams): TimeSlot[] {
  const extraBreaks = (params.extraBreaks ?? []).map(brk => ({
    ...brk,
    days: Array.isArray(brk.days) ? brk.days : (brk.days ? [Number(brk.days)] : [1, 2, 3, 4, 5]),
  }))
  const blocked: Array<[number, number]> = [
    [toMinutes(params.lunchStart), toMinutes(params.lunchEnd)],
    [toMinutes(params.recessStart), toMinutes(params.recessEnd)],
    ...extraBreaks
      .filter(b => b.days.length === 5 || b.days.length === 0)
      .map(b => [toMinutes(b.startTime), toMinutes(b.endTime)] as [number, number]),
  ]
  const slots: TimeSlot[] = []
  let cur = toMinutes(params.startTime)
  const end = toMinutes(params.endTime)
  const dur = params.slotDurationMinutes
  while (cur < end) {
    const inside = blocked.find(([bs, be]) => cur >= bs && cur < be)
    if (inside) { cur = inside[1]; continue }
    const slotEnd = cur + dur
    if (slotEnd > end) break
    const overlapping = blocked.find(([bs, be]) => cur < be && slotEnd > bs)
    if (overlapping) { cur = overlapping[1]; continue }
    slots.push({ start: fromMinutes(cur), end: fromMinutes(slotEnd) })
    cur = slotEnd
  }
  return slots
}

function breakDays(days: number[]): number[] {
  return days.length ? days : [1, 2, 3, 4, 5]
}

function fcAppliesToDay(day: number, fc: FlagCeremonyConfig): boolean {
  if (fc.days === 'everyday') return true
  if (fc.days === 'monday') return day === 1
  return (fc.days as number[]).includes(day)
}

function slotOverlapsFC(slot: TimeSlot, fc: FlagCeremonyConfig): boolean {
  return toMinutes(slot.start) < toMinutes(fc.endTime) && toMinutes(slot.end) > toMinutes(fc.startTime)
}

export function buildFlagCeremonyEntries(
  sectionId: string,
  slots: TimeSlot[],
  fc: FlagCeremonyConfig,
): ScheduleEntry[] {
  if (!fc.enabled) return []
  const entries: ScheduleEntry[] = []
  for (const day of [1, 2, 3, 4, 5]) {
    if (!fcAppliesToDay(day, fc)) continue
    for (const slot of slots) {
      if (slotOverlapsFC(slot, fc)) {
        entries.push({ sectionId, subjectId: null, teacherId: null, dayOfWeek: day, slotStartTime: slot.start, slotEndTime: slot.end, specialLabel: 'Flag Ceremony / RHGP' })
      }
    }
  }
  return entries
}

// ---------------------------------------------------------------------------
// Internal per-section state
// ---------------------------------------------------------------------------
interface SectionState {
  matrix: Array<Array<number | null>>
  lockedTeacher: Map<number, string>
  slotsPlaced: Map<number, number>
  entries: ScheduleEntry[]
}

function initSectionState(params: SchedulerParams, slots: TimeSlot[]): SectionState {
  const fc = params.flagCeremony ?? { enabled: false, startTime: '07:00', endTime: '07:30', days: 'monday' as const }
  const extraBreaks = (params.extraBreaks ?? []).map(brk => ({
    ...brk,
    days: Array.isArray(brk.days) ? brk.days : (brk.days ? [Number(brk.days)] : [1, 2, 3, 4, 5]),
  }))
  const matrix: Array<Array<number | null>> = [0, 1, 2, 3, 4].map(() => Array(slots.length).fill(null))
  for (const brk of extraBreaks.filter(b => b.days.length > 0 && b.days.length < 5)) {
    for (const day of breakDays(brk.days)) {
      for (let si = 0; si < slots.length; si++) {
        const s = slots[si]!
        if (toMinutes(s.start) < toMinutes(brk.endTime) && toMinutes(s.end) > toMinutes(brk.startTime)) {
          matrix[day - 1]![si] = -1
        }
      }
    }
  }
  if (fc.enabled) {
    for (const day of [1, 2, 3, 4, 5]) {
      if (!fcAppliesToDay(day, fc)) continue
      for (let si = 0; si < slots.length; si++) {
        if (slotOverlapsFC(slots[si]!, fc)) matrix[day - 1]![si] = -1
      }
    }
  }
  return { matrix, lockedTeacher: new Map(), slotsPlaced: new Map(), entries: [] }
}

// ---------------------------------------------------------------------------
// Skip-day assignment
//
// Used only in perfect-fit schedules (total required hours = total free cells).
// Assigns each subject exactly 1 skip day so the required day distribution
// (freeCells[Mon]=6, freeCells[Tue]=7, etc.) is met: quota[day] = n - freeCells[day]
// subjects must skip that day. Solved via backtracking.
// ---------------------------------------------------------------------------
function computeSkipDays(
  requirements: SubjectRequirement[],
  freeCellsPerDay: number[],
): Map<number, number> | null {
  const n = requirements.length
  const quota = freeCellsPerDay.map(fc => n - fc)
  // Sanity: all quotas non-negative (required for perfect-fit)
  if (quota.some(q => q < 0)) return null
  const remaining = quota.slice()
  const assignment = new Map<number, number>()
  const shuffled = [...requirements].sort(() => Math.random() - 0.5)

  function bt(idx: number): boolean {
    if (idx === shuffled.length) return remaining.every(q => q === 0)
    const req = shuffled[idx]!
    const dayOrder = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5)
    for (const di of dayOrder) {
      if (remaining[di]! <= 0) continue
      assignment.set(req.subjectId, di + 1)
      remaining[di]!--
      if (bt(idx + 1)) return true
      remaining[di]!++
      assignment.delete(req.subjectId)
    }
    return false
  }
  return bt(0) ? assignment : null
}

// ---------------------------------------------------------------------------
// Bipartite matching for one (section, day)
//
// Left  = subjects that must appear on this day
// Right = free slot indices on this day
// Edge  = subject's eligible teacher is free at that slot
//
// Augmenting-path algorithm: O(V × E) for V subjects, E edges.
// Guaranteed to find a valid assignment if one exists (Hall's theorem).
// ---------------------------------------------------------------------------
function matchSubjectsToSlots(
  subjects: SubjectRequirement[],
  dayIdx: number,
  state: SectionState,
  slots: TimeSlot[],
  teacherSlots: Map<string, string>,
  teacherDayCounts: Map<string, number>,
  teacherSectionCounts: Map<string, number>,
  maxPerDay: number,
  enforceConsecutive: boolean,
): Map<number, { si: number; teacherId: string }> | null {
  const day = dayIdx + 1

  // Build adjacency: subject → valid (slot, teacher) options (randomised order)
  const adj = new Map<number, Array<{ si: number; teacherId: string }>>()
  for (const req of subjects) {
    const locked = state.lockedTeacher.get(req.subjectId)
    const candidates = locked
      ? req.eligibleTeachers.filter(t => t.teacherId === locked)
      : req.eligibleTeachers.filter(({ teacherId, sectionCount }) => {
          const used = teacherSectionCounts.get(`${teacherId}-${req.subjectId}-${req.yearLevelId}`) ?? 0
          return used < sectionCount
        })

    const opts: Array<{ si: number; teacherId: string }> = []
    const siOrder = [...Array(slots.length).keys()].sort(() => Math.random() - 0.5)
    for (const si of siOrder) {
      if (state.matrix[dayIdx]![si] !== null) continue
      // avoidConsecutiveSameSubject: skip slot if the same subject is on an adjacent day
      if (enforceConsecutive) {
        if (dayIdx > 0 && state.matrix[dayIdx - 1]![si] === req.subjectId) continue
        if (dayIdx < 4 && state.matrix[dayIdx + 1]![si] === req.subjectId) continue
      }
      for (const { teacherId } of candidates) {
        if (teacherSlots.has(`${teacherId}-${day}-${si}`)) continue
        if ((teacherDayCounts.get(`${teacherId}-${day}`) ?? 0) >= maxPerDay) continue
        opts.push({ si, teacherId })
        break
      }
    }
    adj.set(req.subjectId, opts)
  }

  const matchLeft = new Map<number, { si: number; teacherId: string }>()
  const matchRight = new Map<number, number>()

  function augment(subjectId: number, visited: Set<number>): boolean {
    for (const opt of adj.get(subjectId) ?? []) {
      if (visited.has(opt.si)) continue
      visited.add(opt.si)
      const existing = matchRight.get(opt.si)
      if (existing === undefined || augment(existing, visited)) {
        matchLeft.set(subjectId, opt)
        matchRight.set(opt.si, subjectId)
        return true
      }
    }
    return false
  }

  for (const req of subjects) {
    if (!augment(req.subjectId, new Set())) {
      // avoidConsecutive failed: retry without that constraint
      if (enforceConsecutive) return matchSubjectsToSlots(subjects, dayIdx, state, slots, teacherSlots, teacherDayCounts, teacherSectionCounts, maxPerDay, false)
      return null
    }
  }
  return matchLeft
}

// ---------------------------------------------------------------------------
// Adviser first-slot pre-placement
//
// Forces the adviser's subject into the first available slot on the given day.
// Ignores the avoidConsecutiveSameSubject constraint (the only exception).
// Returns true if a pre-placement was made.
// ---------------------------------------------------------------------------
function tryPreplaceAdviser(
  sectionId: string,
  requirements: SubjectRequirement[],
  adviserTeacherId: string,
  dayIdx: number,
  state: SectionState,
  slots: TimeSlot[],
  teacherSlots: Map<string, string>,
  teacherDayCounts: Map<string, number>,
  internalSectionCounts: Map<string, number>,
  maxPerDay: number,
): boolean {
  const day = dayIdx + 1
  const firstFreeSlot = state.matrix[dayIdx]!.findIndex(c => c === null)
  if (firstFreeSlot === -1) return false

  for (const req of requirements) {
    const placed = state.slotsPlaced.get(req.subjectId) ?? 0
    if (placed >= req.hoursPerWeek) continue
    const adviserEligible = req.eligibleTeachers.find(t => t.teacherId === adviserTeacherId)
    if (!adviserEligible) continue
    if (teacherSlots.has(`${adviserTeacherId}-${day}-${firstFreeSlot}`)) continue
    if ((teacherDayCounts.get(`${adviserTeacherId}-${day}`) ?? 0) >= maxPerDay) continue
    const countKey = `${adviserTeacherId}-${req.subjectId}-${req.yearLevelId}`
    if (!state.lockedTeacher.has(req.subjectId)) {
      const used = internalSectionCounts.get(countKey) ?? 0
      if (used >= adviserEligible.sectionCount) continue
    } else if (state.lockedTeacher.get(req.subjectId) !== adviserTeacherId) {
      continue
    }

    state.matrix[dayIdx]![firstFreeSlot] = req.subjectId
    teacherSlots.set(`${adviserTeacherId}-${day}-${firstFreeSlot}`, sectionId)
    teacherDayCounts.set(`${adviserTeacherId}-${day}`, (teacherDayCounts.get(`${adviserTeacherId}-${day}`) ?? 0) + 1)
    state.slotsPlaced.set(req.subjectId, placed + 1)
    state.entries.push({
      sectionId, subjectId: req.subjectId, teacherId: adviserTeacherId, dayOfWeek: day,
      slotStartTime: slots[firstFreeSlot]!.start, slotEndTime: slots[firstFreeSlot]!.end, specialLabel: null,
    })
    if (!state.lockedTeacher.has(req.subjectId)) {
      state.lockedTeacher.set(req.subjectId, adviserTeacherId)
      internalSectionCounts.set(countKey, (internalSectionCounts.get(countKey) ?? 0) + 1)
    }
    return true
  }
  return false
}

// ---------------------------------------------------------------------------
// Core scheduling loop shared by generateSchedule and generateAllSchedules
// ---------------------------------------------------------------------------
function scheduleSection(
  sectionId: string,
  requirements: SubjectRequirement[],
  params: SchedulerParams,
  state: SectionState,
  slots: TimeSlot[],
  maxPerDay: number,
  skipDays: Map<number, number>,
  freeCells: number[],
  teacherSlots: Map<string, string>,
  teacherDayCounts: Map<string, number>,
  teacherSectionCounts: Map<string, number>,
  onLock?: (req: SubjectRequirement, teacherId: string) => void,
) {
  // Process days from tightest (fewest free cells) to loosest
  const dayOrder = [0, 1, 2, 3, 4].sort((a, b) => freeCells[a]! - freeCells[b]!)

  for (const dayIdx of dayOrder) {
    const day = dayIdx + 1
    // Include subjects that still need more slots and aren't skipping this day
    const subjectsOnDay = requirements.filter(r => {
      const placed = state.slotsPlaced.get(r.subjectId) ?? 0
      return placed < r.hoursPerWeek && skipDays.get(r.subjectId) !== day
    })
    if (subjectsOnDay.length === 0) continue

    const matching = matchSubjectsToSlots(
      subjectsOnDay, dayIdx, state, slots,
      teacherSlots, teacherDayCounts, teacherSectionCounts,
      maxPerDay, params.avoidConsecutiveSameSubject,
    )
    if (!matching) continue

    for (const req of subjectsOnDay) {
      const m = matching.get(req.subjectId)
      if (!m) continue
      const { si, teacherId } = m
      state.matrix[dayIdx]![si] = req.subjectId
      teacherSlots.set(`${teacherId}-${day}-${si}`, sectionId)
      teacherDayCounts.set(`${teacherId}-${day}`, (teacherDayCounts.get(`${teacherId}-${day}`) ?? 0) + 1)
      state.slotsPlaced.set(req.subjectId, (state.slotsPlaced.get(req.subjectId) ?? 0) + 1)
      state.entries.push({
        sectionId, subjectId: req.subjectId, teacherId, dayOfWeek: day,
        slotStartTime: slots[si]!.start, slotEndTime: slots[si]!.end, specialLabel: null,
      })
      if (!state.lockedTeacher.has(req.subjectId)) {
        state.lockedTeacher.set(req.subjectId, teacherId)
        onLock?.(req, teacherId)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// generateSchedule — single-section entry point (unit tests + per-section use)
// ---------------------------------------------------------------------------

export function generateSchedule(
  sectionId: string,
  requirements: SubjectRequirement[],
  params: SchedulerParams,
  ctx: SchedulerContext,
  adviserTeacherId?: string,
): ScheduleEntry[] {
  const safeCtx: SchedulerContext = {
    teacherSlots: ctx?.teacherSlots ?? new Map(),
    teacherSectionCounts: ctx?.teacherSectionCounts ?? new Map(),
    teacherDayCounts: ctx?.teacherDayCounts ?? new Map(),
  }
  const slots = generateTimeSlots(params)
  const maxPerDay = params.maxHoursPerTeacherPerDay ?? slots.length
  const state = initSectionState(params, slots)
  const internalSectionCounts = new Map<string, number>()

  if (params.adviserFirstSlot && adviserTeacherId) {
    for (const dayIdx of [1, 2, 3, 4]) {
      tryPreplaceAdviser(sectionId, requirements, adviserTeacherId, dayIdx, state, slots,
        safeCtx.teacherSlots, safeCtx.teacherDayCounts, internalSectionCounts, maxPerDay)
    }
  }

  const freeCells = [0, 1, 2, 3, 4].map(di => state.matrix[di]!.filter(c => c === null).length)
  const totalFree = freeCells.reduce((s, c) => s + c, 0)

  // Skip-day assignment only needed for perfect-fit schedules.
  // Use only requirements that still have remaining hours (pre-placements may have
  // fully satisfied the adviser's subject already).
  const remainingForSkip = requirements.filter(r => (state.slotsPlaced.get(r.subjectId) ?? 0) < r.hoursPerWeek)
  const totalRemainingHours = remainingForSkip.reduce((s, r) => s + r.hoursPerWeek - (state.slotsPlaced.get(r.subjectId) ?? 0), 0)
  const skipDays = (totalRemainingHours === totalFree)
    ? (computeSkipDays(remainingForSkip, freeCells) ?? new Map<number, number>())
    : new Map<number, number>()

  scheduleSection(
    sectionId, requirements, params, state, slots, maxPerDay, skipDays, freeCells,
    safeCtx.teacherSlots, safeCtx.teacherDayCounts, safeCtx.teacherSectionCounts,
  )

  return state.entries
}

// ---------------------------------------------------------------------------
// generateAllSchedules — multi-section entry point (preferred for production)
//
// Algorithm:
//   1. Pre-assign skip days for each section via backtracking so the day
//      distribution exactly matches the free-cell counts (Mon=6, Tue=7…).
//      This prevents subjects from ever running out of valid days for their
//      last slot — the root cause of greedy algorithm failures.
//
//   2. Day-first scheduling (tightest day first): for each day, process all
//      sections. Within each (day, section) pair, run augmenting-path bipartite
//      matching to assign ALL subjects appearing on that day to unique slots in
//      one shot. This is guaranteed to succeed whenever a valid assignment
//      exists (Hall's theorem), eliminating greedy "last-slot alignment" failures.
//
//   3. Sections are processed in random order within each day (varied across
//      the 20 retry attempts) so no section is systematically disadvantaged.
//
//   4. teacherSectionCounts is updated in real-time when a teacher is first
//      locked for a section, so sectionCount caps are enforced across sections.
//
// Caller should NOT call recordSectionAssignment separately.
// ---------------------------------------------------------------------------

export function generateAllSchedules(
  sections: Array<{ sectionId: string; requirements: SubjectRequirement[]; adviserTeacherId?: string }>,
  params: SchedulerParams,
  ctx: SchedulerContext,
): Map<string, ScheduleEntry[]> {
  const safeCtx: SchedulerContext = {
    teacherSlots: ctx?.teacherSlots ?? new Map(),
    teacherSectionCounts: ctx?.teacherSectionCounts ?? new Map(),
    teacherDayCounts: ctx?.teacherDayCounts ?? new Map(),
  }

  const slots = generateTimeSlots(params)
  const maxPerDay = params.maxHoursPerTeacherPerDay ?? slots.length

  // Internal section counts: updated when a teacher is first locked so subsequent
  // sections see accurate caps without waiting for recordSectionAssignment.
  const internalSectionCounts = new Map<string, number>()

  const sectionStates = new Map<string, SectionState>()
  for (const { sectionId } of sections) {
    sectionStates.set(sectionId, initSectionState(params, slots))
  }

  // Original freeCells (before any pre-placements) — used for day ordering
  const exampleStateForOrder = sectionStates.get(sections[0]?.sectionId ?? '')
  const originalFreeCells = exampleStateForOrder
    ? [0, 1, 2, 3, 4].map(di => exampleStateForOrder.matrix[di]!.filter(c => c === null).length)
    : [6, 7, 7, 7, 5]

  // Phase 0: pre-place adviser subjects (Tue–Fri) before skip-day computation so that
  // skip days are computed against the correct remaining free-cell counts and remaining
  // requirements. Doing this inside the day loop (after skip-day assignment) caused the
  // pre-placements to consume cells that the skip-day quota still expected to be free,
  // making the bipartite matching try to fit n subjects into n-1 slots and always fail.
  if (params.adviserFirstSlot) {
    for (const { sectionId, requirements, adviserTeacherId } of sections) {
      if (!adviserTeacherId) continue
      const state = sectionStates.get(sectionId)!
      for (const dayIdx of [1, 2, 3, 4]) {
        tryPreplaceAdviser(sectionId, requirements, adviserTeacherId, dayIdx, state, slots,
          safeCtx.teacherSlots, safeCtx.teacherDayCounts, internalSectionCounts, maxPerDay)
      }
    }
  }

  // Compute per-section skip days based on post-pre-placement state and remaining requirements
  const sectionSkipDays = new Map<string, Map<number, number>>()
  for (const { sectionId, requirements } of sections) {
    const state = sectionStates.get(sectionId)!
    const sectionFreeCells = [0, 1, 2, 3, 4].map(di => state.matrix[di]!.filter(c => c === null).length)
    const totalFree = sectionFreeCells.reduce((s, c) => s + c, 0)
    const remainingReqs = requirements.filter(r => (state.slotsPlaced.get(r.subjectId) ?? 0) < r.hoursPerWeek)
    const totalRemainingHours = remainingReqs.reduce((s, r) => s + r.hoursPerWeek - (state.slotsPlaced.get(r.subjectId) ?? 0), 0)
    const isPerfectFit = totalRemainingHours === totalFree
    const sd = isPerfectFit
      ? (computeSkipDays(remainingReqs, sectionFreeCells) ?? new Map<number, number>())
      : new Map<number, number>()
    sectionSkipDays.set(sectionId, sd)
  }

  // Day-first: tightest days first (use original freeCells for ordering — structural)
  const dayOrder = [0, 1, 2, 3, 4].sort((a, b) => originalFreeCells[a]! - originalFreeCells[b]!)

  for (const dayIdx of dayOrder) {
    const day = dayIdx + 1
    // Shuffle section order per day for diversity across retry attempts
    const sectionOrder = [...sections].sort(() => Math.random() - 0.5)

    for (const { sectionId, requirements } of sectionOrder) {
      const state = sectionStates.get(sectionId)!
      const skipDays = sectionSkipDays.get(sectionId)!

      const subjectsOnDay = requirements.filter(r => {
        const placed = state.slotsPlaced.get(r.subjectId) ?? 0
        return placed < r.hoursPerWeek && skipDays.get(r.subjectId) !== day
      })
      if (subjectsOnDay.length === 0) continue

      const matching = matchSubjectsToSlots(
        subjectsOnDay, dayIdx, state, slots,
        safeCtx.teacherSlots, safeCtx.teacherDayCounts, internalSectionCounts,
        maxPerDay, params.avoidConsecutiveSameSubject,
      )
      if (!matching) continue

      for (const req of subjectsOnDay) {
        const m = matching.get(req.subjectId)
        if (!m) continue
        const { si, teacherId } = m
        state.matrix[dayIdx]![si] = req.subjectId
        safeCtx.teacherSlots.set(`${teacherId}-${day}-${si}`, sectionId)
        safeCtx.teacherDayCounts.set(`${teacherId}-${day}`, (safeCtx.teacherDayCounts.get(`${teacherId}-${day}`) ?? 0) + 1)
        state.slotsPlaced.set(req.subjectId, (state.slotsPlaced.get(req.subjectId) ?? 0) + 1)
        state.entries.push({
          sectionId, subjectId: req.subjectId, teacherId, dayOfWeek: day,
          slotStartTime: slots[si]!.start, slotEndTime: slots[si]!.end, specialLabel: null,
        })
        if (!state.lockedTeacher.has(req.subjectId)) {
          state.lockedTeacher.set(req.subjectId, teacherId)
          const key = `${teacherId}-${req.subjectId}-${req.yearLevelId}`
          internalSectionCounts.set(key, (internalSectionCounts.get(key) ?? 0) + 1)
        }
      }
    }
  }

  // Update global context section counts
  for (const { sectionId, requirements } of sections) {
    recordSectionAssignment(sectionStates.get(sectionId)!.entries, requirements, safeCtx)
  }

  return new Map(sections.map(({ sectionId }) => [sectionId, sectionStates.get(sectionId)!.entries]))
}

// ---------------------------------------------------------------------------
// recordSectionAssignment
// ---------------------------------------------------------------------------

export function recordSectionAssignment(
  entries: ScheduleEntry[],
  requirements: SubjectRequirement[],
  ctx: SchedulerContext,
) {
  const safeCtx: SchedulerContext = {
    teacherSlots: ctx?.teacherSlots ?? new Map(),
    teacherSectionCounts: ctx?.teacherSectionCounts ?? new Map(),
    teacherDayCounts: ctx?.teacherDayCounts ?? new Map(),
  }
  for (const req of requirements) {
    const teacherIds = new Set(
      entries.filter(e => e.subjectId === req.subjectId && e.teacherId != null).map(e => e.teacherId!),
    )
    for (const teacherId of teacherIds) {
      const key = `${teacherId}-${req.subjectId}-${req.yearLevelId}`
      safeCtx.teacherSectionCounts.set(key, (safeCtx.teacherSectionCounts.get(key) ?? 0) + 1)
    }
  }
}
