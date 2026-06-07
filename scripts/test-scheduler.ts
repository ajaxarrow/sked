/**
 * Rigorous scheduler test against Lampanusan NHS seed data.
 * Run with: npx tsx scripts/test-scheduler.ts
 *
 * Validates:
 *   1. Every subject appears exactly hoursPerWeek times per section (no vacants, no over-schedule)
 *   2. Every subject is spread across different days (one instance per day max)
 *   3. No subject appears twice on the same day within a section
 *   4. No teacher is double-booked (same day + same slot in two different sections)
 *
 * Mirrors the API exactly: same params, same MAX_ATTEMPTS, same retry logic.
 */

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { eq, and } from 'drizzle-orm'
import { resolve } from 'path'
import * as schema from '../server/database/schema.js'
import {
  generateAllSchedules, generateTimeSlots,
  type SchedulerContext, type SubjectRequirement, type ScheduleEntry,
} from '../server/utils/scheduler.js'

const { sections, subjects, yearLevels, teacherSubjects, teachers } = schema

const RUNS = 25
const MAX_ATTEMPTS = 20  // must match API

// Exact params from the UI generate modal — keep in sync with generate.post.ts defaults
const params = {
  startTime: '07:00',
  endTime: '16:00',
  recessStart: '09:00',
  recessEnd: '09:30',
  lunchStart: '12:00',
  lunchEnd: '13:00',
  slotDurationMinutes: 60,
  avoidConsecutiveSameSubject: true,
  extraBreaks: [
    { label: 'Ancillary', startTime: '11:30', endTime: '12:00', days: [1, 2, 3, 4, 5] },
    { label: 'LAC Session', startTime: '14:00', endTime: '16:00', days: [5] },
  ] as Array<{ label: string; startTime: string; endTime: string; days: number[] }>,
  flagCeremony: { enabled: true, startTime: '07:00', endTime: '08:00', days: 'monday' as const },
  maxHoursPerTeacherPerDay: 6,
}

// --- per-section validation --------------------------------------------------

function validateSection(
  section: { id: string; name: string },
  entries: ScheduleEntry[],
  requirements: SubjectRequirement[],
): string[] {
  const subjectName = new Map(requirements.map(r => [r.subjectId, r.subjectName]))
  const issues: string[] = []

  const subjectEntries = entries.filter(e => e.subjectId != null)
  const expectedTotal = requirements.reduce((s, r) => s + r.hoursPerWeek, 0)

  if (subjectEntries.length !== expectedTotal) {
    issues.push(`${section.name}: expected ${expectedTotal} total subject slots, got ${subjectEntries.length}`)
  }

  for (const req of requirements) {
    const got = entries.filter(e => e.subjectId === req.subjectId).length
    if (got !== req.hoursPerWeek) {
      issues.push(`${section.name}: ${req.subjectName} needs ${req.hoursPerWeek}h/wk, got ${got}`)
    }

    // each instance must be on a different day
    const days = entries.filter(e => e.subjectId === req.subjectId).map(e => e.dayOfWeek)
    const uniqueDays = new Set(days)
    if (uniqueDays.size !== got) {
      issues.push(`${section.name}: ${req.subjectName} not spread across different days (days: ${[...uniqueDays].join(',')})`)
    }
  }

  // no subject twice on the same day within this section
  for (const day of [1, 2, 3, 4, 5]) {
    const bySubject = new Map<number, number>()
    for (const e of entries.filter(e => e.dayOfWeek === day && e.subjectId != null)) {
      bySubject.set(e.subjectId!, (bySubject.get(e.subjectId!) ?? 0) + 1)
    }
    for (const [sid, count] of bySubject) {
      if (count > 1) {
        issues.push(`${section.name}: ${subjectName.get(sid) ?? sid} appears ${count}× on day ${day} (same-day duplicate)`)
      }
    }
  }

  return issues
}

// --- cross-section teacher conflict validation --------------------------------

function validateTeacherConflicts(
  allEntries: Map<string, ScheduleEntry[]>,
  teacherNameById: Map<string, string>,
  sectionNameById: Map<string, string>,
): string[] {
  const issues: string[] = []
  // key: `${teacherId}-${dayOfWeek}-${slotStartTime}` → first section that claimed it
  const booked = new Map<string, string>()

  for (const [sectionId, entries] of allEntries) {
    const secName = sectionNameById.get(sectionId) ?? sectionId
    for (const e of entries) {
      if (!e.teacherId || e.specialLabel) continue
      const key = `${e.teacherId}-${e.dayOfWeek}-${e.slotStartTime}`
      if (booked.has(key)) {
        const tName = teacherNameById.get(e.teacherId) ?? e.teacherId
        issues.push(`Teacher ${tName}: double-booked day ${e.dayOfWeek} ${e.slotStartTime} in ${booked.get(key)} AND ${secName}`)
      } else {
        booked.set(key, secName)
      }
    }
  }

  return issues
}

// --- retry logic (mirrors API) -----------------------------------------------

async function runWithRetry(
  allSections: Array<{ id: string; name: string; yearLevelId: number }>,
  requirementsMap: Map<string, SubjectRequirement[]>,
  teacherNameById: Map<string, string>,
): Promise<{ issues: string[]; attemptsUsed: number }> {
  let bestIssueCount = Infinity
  let bestIssues: string[] = []

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const ctx: SchedulerContext = {
      teacherSlots: new Map(),
      teacherSectionCounts: new Map(),
      teacherDayCounts: new Map(),
    }
    const attemptEntries = new Map<string, ScheduleEntry[]>()
    const attemptIssues: string[] = []

    const sectionsForScheduler = allSections.map(s => ({
      sectionId: s.id,
      requirements: requirementsMap.get(s.id)!,
    }))
    const allEntriesMap = generateAllSchedules(sectionsForScheduler, params, ctx)
    for (const section of allSections) {
      const entries = allEntriesMap.get(section.id) ?? []
      attemptEntries.set(section.id, entries)
      attemptIssues.push(...validateSection(section, entries, requirementsMap.get(section.id)!))
    }

    const sectionNameById = new Map(allSections.map(s => [s.id, s.name]))
    attemptIssues.push(...validateTeacherConflicts(attemptEntries, teacherNameById, sectionNameById))

    if (attemptIssues.length < bestIssueCount) {
      bestIssueCount = attemptIssues.length
      bestIssues = attemptIssues
    }
    if (bestIssueCount === 0) return { issues: [], attemptsUsed: attempt }
  }

  return { issues: bestIssues, attemptsUsed: MAX_ATTEMPTS }
}

// --- main --------------------------------------------------------------------

async function main() {
  const sqlite = new Database(resolve('./sked.db'))
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite, { schema })

  const slots = generateTimeSlots(params)

  // Compute available slots after day-specific blocks (flag ceremony, day-only extra breaks)
  function toMin(t: string) { const [h, m] = t.split(':').map(Number); return h! * 60 + m! }
  const dayBlocked = [0, 0, 0, 0, 0]
  for (const brk of (params.extraBreaks ?? [])) {
    const days = brk.days?.length ? brk.days : [1, 2, 3, 4, 5]
    const brkSlotCount = slots.filter(s => toMin(s.start) >= toMin(brk.startTime) && toMin(s.end) <= toMin(brk.endTime)).length
    for (const d of days) dayBlocked[d - 1]! += brkSlotCount
  }
  if (params.flagCeremony?.enabled) {
    const fc = params.flagCeremony
    const fcSlotCount = slots.filter(s => toMin(s.start) < toMin(fc.endTime) && toMin(s.end) > toMin(fc.startTime)).length
    const fcDays = fc.days === 'everyday' ? [1,2,3,4,5] : fc.days === 'monday' ? [1] : fc.days as number[]
    for (const d of fcDays) dayBlocked[d - 1]! += fcSlotCount
  }
  const available = slots.length * 5 - dayBlocked.reduce((s, c) => s + c, 0)

  console.log(`Config: ${slots.length} slots/day × 5 days = ${available} available slots (${slots.length * 5 - available} blocked by flag/day-breaks)`)
  console.log(`Slots: ${slots.map(s => s.start).join(' | ')}\n`)

  const allSections = await db.select({
    id: sections.id,
    name: sections.name,
    yearLevelId: sections.yearLevelId,
  }).from(sections).all()

  // Build teacher name lookup
  const allTeachers = await db.select({ id: teachers.id, name: teachers.name }).from(teachers).all()
  const teacherNameById = new Map(allTeachers.map(t => [t.id, t.name]))

  // Pre-load requirements
  const requirementsMap = new Map<string, SubjectRequirement[]>()
  let totalHoursNeeded = 0
  for (const section of allSections) {
    const [yearLevel] = await db.select().from(yearLevels).where(eq(yearLevels.id, section.yearLevelId)).all()
    if (!yearLevel) continue
    const subjectList = await db.select().from(subjects)
      .where(eq(subjects.scheduleTypeId, yearLevel.scheduleTypeId)).all()
    const reqs: SubjectRequirement[] = []
    for (const sub of subjectList) {
      const eligible = await db
        .select({ teacherId: teacherSubjects.teacherId, sectionCount: teacherSubjects.sectionCount })
        .from(teacherSubjects)
        .where(and(eq(teacherSubjects.subjectId, sub.id), eq(teacherSubjects.yearLevelId, section.yearLevelId)))
        .all()
      reqs.push({
        subjectId: sub.id,
        subjectName: sub.name,
        yearLevelId: section.yearLevelId,
        hoursPerWeek: sub.hoursPerWeek,
        eligibleTeachers: eligible,
      })
    }
    requirementsMap.set(section.id, reqs)
    totalHoursNeeded += reqs.reduce((s, r) => s + r.hoursPerWeek, 0)
  }

  const hoursPerSection = totalHoursNeeded / allSections.length
  console.log(`${allSections.length} sections · ${hoursPerSection} hours/section · ${totalHoursNeeded} total`)
  console.log(`Checking: exact hours/week, no same-day duplicates, no teacher conflicts`)
  console.log(`Max attempts per run: ${MAX_ATTEMPTS} (matches API)\n`)
  console.log(`Running ${RUNS} independent runs...\n`)

  let passed = 0
  let failed = 0
  let maxAttemptsNeeded = 0

  for (let run = 1; run <= RUNS; run++) {
    const { issues, attemptsUsed } = await runWithRetry(allSections, requirementsMap, teacherNameById)
    maxAttemptsNeeded = Math.max(maxAttemptsNeeded, attemptsUsed)
    if (issues.length === 0) {
      const note = attemptsUsed > 1 ? ` (needed ${attemptsUsed} attempts)` : ''
      console.log(`  Run ${run}: ✓ PASS${note}`)
      passed++
    } else {
      console.log(`  Run ${run}: ✗ FAIL after ${attemptsUsed} attempts — ${issues.length} issue(s):`)
      issues.slice(0, 8).forEach(i => console.log(`     ${i}`))
      if (issues.length > 8) console.log(`     … and ${issues.length - 8} more`)
      failed++
    }
  }

  console.log('\n' + '='.repeat(60))
  if (failed === 0) {
    console.log(`✓ ALL ${RUNS} RUNS PASSED`)
    console.log(`  Max attempts needed: ${maxAttemptsNeeded}/${MAX_ATTEMPTS}`)
  } else {
    console.log(`✗ ${failed}/${RUNS} RUNS FAILED`)
  }

  sqlite.close()
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
