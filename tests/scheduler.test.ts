import { describe, it, expect } from 'vitest'
import { generateTimeSlots, generateSchedule, buildFlagCeremonyEntries, recordSectionAssignment } from '../server/utils/scheduler'

const baseParams = {
  startTime: '07:00',
  endTime: '17:00',
  recessStart: '09:00',
  recessEnd: '09:15',
  lunchStart: '12:00',
  lunchEnd: '13:00',
  slotDurationMinutes: 60,
  avoidConsecutiveSameSubject: false,
  extraBreaks: [],
}

const noBreakParams = {
  ...baseParams,
  startTime: '07:00',
  endTime: '13:00',
  recessStart: '23:00',
  recessEnd: '23:01',
  lunchStart: '23:00',
  lunchEnd: '23:01',
}

function makeCtx() {
  return {
    teacherSlots: new Map<string, string>(),
    teacherSectionCounts: new Map<string, number>(),
    teacherDayCounts: new Map<string, number>(),
    teacherSubjectDayCounts: new Map<string, number>(),
  }
}

describe('generateTimeSlots', () => {
  it('generates hourly slots between start and end', () => {
    const slots = generateTimeSlots({ ...baseParams, startTime: '07:00', endTime: '10:00' })
    expect(slots).toHaveLength(2)
    expect(slots[0]).toEqual({ start: '07:00', end: '08:00' })
    expect(slots[1]).toEqual({ start: '08:00', end: '09:00' })
  })

  it('excludes lunch break', () => {
    const slots = generateTimeSlots({ ...baseParams, startTime: '11:00', endTime: '14:00' })
    expect(slots).toHaveLength(2)
    expect(slots[0]).toEqual({ start: '11:00', end: '12:00' })
    expect(slots[1]).toEqual({ start: '13:00', end: '14:00' })
  })

  it('respects extra breaks', () => {
    const slots = generateTimeSlots({
      ...baseParams,
      startTime: '07:00',
      endTime: '10:00',
      extraBreaks: [{ startTime: '08:00', endTime: '09:00' }],
    })
    expect(slots).toHaveLength(1)
    expect(slots[0]).toEqual({ start: '07:00', end: '08:00' })
  })
})

describe('buildFlagCeremonyEntries', () => {
  const slots = [{ start: '07:00', end: '08:00' }, { start: '08:00', end: '09:00' }]
  const fc = { enabled: true, startTime: '07:00', endTime: '07:30', days: 'everyday' as const }

  it('generates flag ceremony for all weekdays when days=everyday', () => {
    const entries = buildFlagCeremonyEntries('sec-1', slots, fc)
    expect(entries).toHaveLength(5)
    expect(entries.every(e => e.specialLabel === 'Flag Ceremony')).toBe(true)
    expect(entries.every(e => e.slotStartTime === '07:00')).toBe(true)
  })

  it('only generates for Monday when days=monday', () => {
    const entries = buildFlagCeremonyEntries('sec-1', slots, { ...fc, days: 'monday' })
    expect(entries).toHaveLength(1)
    expect(entries[0]!.dayOfWeek).toBe(1)
  })

  it('returns empty when disabled', () => {
    expect(buildFlagCeremonyEntries('sec-1', slots, { ...fc, enabled: false })).toHaveLength(0)
  })
})

describe('generateSchedule', () => {
  it('assigns each subject exactly the configured weekly hours and spreads them across different days', () => {
    const ctx = makeCtx()
    const requirements = [
      { subjectId: 1, subjectName: 'Math', yearLevelId: 1, hoursPerWeek: 5, eligibleTeachers: [{ teacherId: 't-1', sectionCount: 99 }] },
      { subjectId: 2, subjectName: 'English', yearLevelId: 1, hoursPerWeek: 3, eligibleTeachers: [{ teacherId: 't-2', sectionCount: 99 }] },
    ]

    const entries = generateSchedule('sec-1', requirements, noBreakParams, ctx)

    expect(entries).toHaveLength(8)

    for (const req of requirements) {
      const subjectEntries = entries.filter(e => e.subjectId === req.subjectId)
      expect(subjectEntries).toHaveLength(req.hoursPerWeek)
      expect(new Set(subjectEntries.map(e => e.dayOfWeek)).size).toBe(req.hoursPerWeek)
      expect(subjectEntries.every(e => e.teacherId != null)).toBe(true)
      expect(subjectEntries.some(e => e.specialLabel == null)).toBe(true)
    }

    const mathSlots = entries.filter(e => e.subjectId === 1)
    const englishSlots = entries.filter(e => e.subjectId === 2)
    expect(mathSlots).toHaveLength(5)
    expect(englishSlots).toHaveLength(3)
    expect(new Set(mathSlots.map(e => e.dayOfWeek)).size).toBe(5)
    expect(new Set(englishSlots.map(e => e.dayOfWeek)).size).toBe(3)
  })

  it('respects avoidConsecutiveSameSubject', () => {
    const ctx = makeCtx()
    const entries = generateSchedule(
      'sec-1',
      [{ subjectId: 1, subjectName: 'Math', yearLevelId: 1, hoursPerWeek: 5, eligibleTeachers: [{ teacherId: 't-1', sectionCount: 99 }] }],
      { ...noBreakParams, avoidConsecutiveSameSubject: true },
      ctx,
    )
    for (const e of entries) {
      const conflict = entries.find(x => x !== e && x.dayOfWeek === e.dayOfWeek + 1 && x.slotStartTime === e.slotStartTime && x.subjectId === e.subjectId)
      expect(conflict).toBeUndefined()
    }
  })

  it('does not double-book a teacher across sections', () => {
    const ctx = makeCtx()
    const params = { ...noBreakParams, startTime: '07:00', endTime: '09:00' }

    for (let day = 1; day <= 5; day++) {
      ctx.teacherDayCounts.set(`t-1-${day}`, 6)
    }

    const s2 = generateSchedule('sec-2', [{ subjectId: 2, subjectName: 'Science', yearLevelId: 1, hoursPerWeek: 2, eligibleTeachers: [{ teacherId: 't-1', sectionCount: 99 }] }], params, ctx)
    expect(s2).toHaveLength(0)
  })

  it('respects sectionCount — teacher limited to N sections for a subject', () => {
    const ctx = makeCtx()
    const req = [{ subjectId: 1, subjectName: 'Filipino', yearLevelId: 2, hoursPerWeek: 4, eligibleTeachers: [{ teacherId: 't-10', sectionCount: 2 }] }]

    const s1 = generateSchedule('sec-1', req, noBreakParams, ctx)
    expect(s1.filter(e => e.subjectId === 1)).toHaveLength(4)
    recordSectionAssignment(s1, req, ctx)

    const s2 = generateSchedule('sec-2', req, noBreakParams, ctx)
    expect(s2.filter(e => e.subjectId === 1)).toHaveLength(4)
    recordSectionAssignment(s2, req, ctx)

    const s3 = generateSchedule('sec-3', req, noBreakParams, ctx)
    expect(s3.filter(e => e.subjectId === 1)).toHaveLength(0)
  })

  it('limits the same subject to one slot per teacher per day', () => {
    const ctx = makeCtx()
    const entries = generateSchedule(
      'sec-1',
      [{ subjectId: 1, subjectName: 'Math', yearLevelId: 1, hoursPerWeek: 2, eligibleTeachers: [{ teacherId: 't-1', sectionCount: 99 }] }],
      { ...noBreakParams, startTime: '07:00', endTime: '09:00', fillRemainingSlots: true },
      ctx,
    )

    const byDay = new Map<number, number>()
    for (const e of entries) {
      if (e.subjectId === 1) {
        byDay.set(e.dayOfWeek, (byDay.get(e.dayOfWeek) ?? 0) + 1)
      }
    }

    expect([...byDay.values()].every(v => v <= 1)).toBe(true)
  })

  it('blocks flag ceremony slots from regular subject assignment', () => {
    const ctx = makeCtx()
    const params = {
      ...noBreakParams,
      flagCeremony: { enabled: true, startTime: '07:00', endTime: '07:30', days: 'monday' as const },
    }
    const entries = generateSchedule(
      'sec-1',
      [{ subjectId: 1, subjectName: 'Math', yearLevelId: 1, hoursPerWeek: 4, eligibleTeachers: [{ teacherId: 't-1', sectionCount: 99 }] }],
      params,
      ctx,
    )
    const mondayFirst = entries.find(e => e.dayOfWeek === 1 && e.slotStartTime === '07:00')
    expect(mondayFirst).toBeUndefined()
  })
})

// Real-world params: 7am–4pm, recess 9–9:30, lunch 11:30–1pm, flag ceremony Mon 7–8am, LAC session Fri 2–4pm
const lacParams = {
  startTime: '07:00',
  endTime: '16:00',
  recessStart: '09:00',
  recessEnd: '09:30',
  lunchStart: '11:30',
  lunchEnd: '13:00',
  slotDurationMinutes: 60,
  avoidConsecutiveSameSubject: false,
  extraBreaks: [{ label: 'LAC Session', startTime: '14:00', endTime: '16:00', days: [5] }],
  flagCeremony: { enabled: true, startTime: '07:00', endTime: '08:00', days: 'monday' as const },
}

describe('7-slot day with flag ceremony + LAC session = 32 available slots', () => {
  it('generateTimeSlots returns exactly 7 slots', () => {
    const slots = generateTimeSlots(lacParams)
    expect(slots).toHaveLength(7)
    expect(slots[0]).toEqual({ start: '07:00', end: '08:00' })
    expect(slots[1]).toEqual({ start: '08:00', end: '09:00' })
    expect(slots[2]).toEqual({ start: '09:30', end: '10:30' })
    expect(slots[3]).toEqual({ start: '10:30', end: '11:30' })
    expect(slots[4]).toEqual({ start: '13:00', end: '14:00' })
    expect(slots[5]).toEqual({ start: '14:00', end: '15:00' })
    expect(slots[6]).toEqual({ start: '15:00', end: '16:00' })
  })

  it('blocks Mon 07:00 (flag ceremony) and Fri 14:00+15:00 (LAC) — fills exactly 32 of 35 slots', () => {
    const ctx = makeCtx()
    // 33 subjects × 1hr, unique teachers — no teacher conflicts; only 32 slots are free
    const reqs = Array.from({ length: 33 }, (_, i) => ({
      subjectId: i + 1,
      subjectName: `Subject${i + 1}`,
      yearLevelId: 1,
      hoursPerWeek: 1,
      eligibleTeachers: [{ teacherId: `t-${i + 1}`, sectionCount: 99 }],
    }))
    const entries = generateSchedule('sec-1', reqs, lacParams, ctx)
    expect(entries).toHaveLength(32)
    expect(entries.find(e => e.dayOfWeek === 1 && e.slotStartTime === '07:00')).toBeUndefined()
    expect(entries.find(e => e.dayOfWeek === 5 && e.slotStartTime === '14:00')).toBeUndefined()
    expect(entries.find(e => e.dayOfWeek === 5 && e.slotStartTime === '15:00')).toBeUndefined()
  })
})
