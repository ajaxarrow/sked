import { describe, it, expect } from 'vitest'
import { generateTimeSlots, generateSchedule } from '../server/utils/scheduler'

const baseParams = {
  recessStart: '09:00',
  recessEnd: '09:15',
  lunchStart: '12:00',
  lunchEnd: '13:00',
  slotDurationMinutes: 60,
  avoidConsecutiveSameSubject: false,
  extraBreaks: [],
}

describe('generateTimeSlots', () => {
  it('generates hourly slots between start and end', () => {
    const slots = generateTimeSlots({ ...baseParams, startTime: '07:00', endTime: '10:00' })
    // 07-08 ok, 08-09 ok, 09-10 overlaps recess (09:00-09:15) → skipped
    expect(slots).toHaveLength(2)
    expect(slots[0]).toEqual({ start: '07:00', end: '08:00' })
    expect(slots[1]).toEqual({ start: '08:00', end: '09:00' })
  })

  it('excludes lunch break slot', () => {
    const slots = generateTimeSlots({ ...baseParams, startTime: '11:00', endTime: '14:00' })
    // 11-12 ok, 12-13 blocked (lunch), 13-14 ok
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
    // 07-08 ok, 08-09 blocked by extra break (and 09-10 blocked by recess)
    expect(slots).toHaveLength(1)
    expect(slots[0]).toEqual({ start: '07:00', end: '08:00' })
  })
})

describe('generateSchedule', () => {
  const noBreakParams = {
    ...baseParams,
    startTime: '07:00',
    endTime: '13:00',
    // push recess/lunch outside window so we get clean slots
    recessStart: '23:00',
    recessEnd: '23:01',
    lunchStart: '23:00',
    lunchEnd: '23:01',
  }

  it('assigns all required subject hours', () => {
    const ctx = { teacherSlots: new Map() }
    const entries = generateSchedule(
      1,
      [
        { subjectId: 1, subjectName: 'Math', hoursPerWeek: 4, eligibleTeacherIds: [1] },
        { subjectId: 2, subjectName: 'English', hoursPerWeek: 2, eligibleTeacherIds: [2] },
      ],
      noBreakParams,
      ctx,
    )
    expect(entries.filter(e => e.subjectId === 1)).toHaveLength(4)
    expect(entries.filter(e => e.subjectId === 2)).toHaveLength(2)
  })

  it('respects avoid_consecutive_same_subject constraint', () => {
    const ctx = { teacherSlots: new Map() }
    const entries = generateSchedule(
      1,
      [{ subjectId: 1, subjectName: 'Math', hoursPerWeek: 5, eligibleTeacherIds: [1] }],
      { ...noBreakParams, avoidConsecutiveSameSubject: true },
      ctx,
    )
    for (const entry of entries) {
      const conflict = entries.find(
        e =>
          e !== entry &&
          e.dayOfWeek === entry.dayOfWeek + 1 &&
          e.slotStartTime === entry.slotStartTime &&
          e.subjectId === entry.subjectId,
      )
      expect(conflict).toBeUndefined()
    }
  })

  it('does not double-book a teacher across sections', () => {
    const sharedCtx = { teacherSlots: new Map() }
    // 2 slots/day × 5 days = 10 possible slots. Section 1 fills all 10 with teacher 1.
    generateSchedule(
      1,
      [{ subjectId: 1, subjectName: 'Math', hoursPerWeek: 10, eligibleTeacherIds: [1] }],
      { ...noBreakParams, startTime: '07:00', endTime: '09:00' },
      sharedCtx,
    )
    // Section 2 also only has teacher 1 — every slot is taken
    const section2 = generateSchedule(
      2,
      [{ subjectId: 2, subjectName: 'Science', hoursPerWeek: 2, eligibleTeacherIds: [1] }],
      { ...noBreakParams, startTime: '07:00', endTime: '09:00' },
      sharedCtx,
    )
    expect(section2).toHaveLength(0)
  })
})
