import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { eq } from 'drizzle-orm'
import { resolve } from 'path'
import * as schema from './schema.js'
import { seedJHS } from './seed.js'

const {
  schools, scheduleTypes, schoolYears, teachers, teacherSubjects,
  yearLevels, subjects, sections, scheduleSets, scheduleEntries,
} = schema

type InsertEntry = typeof scheduleEntries.$inferInsert

// ---------------------------------------------------------------------------
// Lookup tables
// ---------------------------------------------------------------------------
const TEACHER_NAMES: Record<string, string> = {
  MAP: 'MAPALAD', BEL: 'BELGIRA', SUM: 'SUMALPONG', SAL: 'SALAR',
  HIS: 'HISANAN', GUL: 'GULAYAN', ACO: 'ACOP', CAP: 'CAPADA',
  SUE: 'SUELA', JAC: 'JACALAN', FAB: 'FABRE', ACL: 'ACLARACION',
  FIE: 'FIEL', DIA: 'DIAZ', TAB: 'TABILLA', DEG: 'DE GUZMAN',
}

const SUBJECT_NAMES: Record<string, string> = {
  FIL: 'Filipino', ENG: 'English', MATH: 'Math', SCI: 'Science',
  MAPEH: 'MAPEH', VALED: 'Values Education', TLE: 'TLE', ARPAN: 'Araling Panlipunan',
}

// ---------------------------------------------------------------------------
// Schedule data
// Section column order: G7A G7B G7C G8A G8B G8C G9A G9B G9C G10A G10B
// Day: 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri
// Cell: [subjectAbbr, teacherKey] | { special: string } | null (skip)
// ---------------------------------------------------------------------------
const SECTIONS_ORDER = ['G7A','G7B','G7C','G8A','G8B','G8C','G9A','G9B','G9C','G10A','G10B']

type Cell = [string, string]
type SpecialCell = { special: string }
type SlotRow = (Cell | SpecialCell | null)[]

function allSpecial(label: string): SlotRow {
  return SECTIONS_ORDER.map(() => ({ special: label }))
}

interface SlotData { start: string; end: string; days: Record<number, SlotRow | null> }

const SCHEDULE: SlotData[] = [
  {
    start: '07:00', end: '08:00',
    days: {
      1: allSpecial('Flag Ceremony / RHGP'),
      2: [['FIL','MAP'],['ENG','BEL'],['MAPEH','SUM'],['ENG','SAL'],['FIL','HIS'],['SCI','GUL'],['VALED','ACO'],['MAPEH','CAP'],['ARPAN','SUE'],['SCI','JAC'],['TLE','FAB']],
      3: [['ENG','BEL'],['TLE','TAB'],['ARPAN','DIA'],['FIL','SUE'],['SCI','GUL'],['MATH','ACL'],['MAPEH','CAP'],['FIL','MAP'],['SCI','JAC'],['VALED','ACO'],['TLE','FAB']],
      4: [['MAPEH','SUM'],['FIL','ACL'],['MATH','TAB'],['ARPAN','FAB'],['TLE','FIE'],['VALED','GUL'],['TLE','HIS'],['ENG','ACO'],['MAPEH','CAP'],['ENG','BEL'],['ARPAN','SUE']],
      5: [['TLE','TAB'],['SCI','DEG'],['FIL','MAP'],['MATH','ACL'],['SCI','GUL'],['MAPEH','SUM'],['ARPAN','SUE'],['SCI','JAC'],['VALED','ACO'],['TLE','FAB'],['MAPEH','CAP']],
    },
  },
  {
    start: '08:00', end: '09:00',
    days: {
      1: [['SCI','DEG'],['MAPEH','SUM'],['VALED','FIE'],['ENG','SAL'],['MATH','ACL'],['ARPAN','FAB'],['TLE','HIS'],['ENG','ACO'],['FIL','MAP'],['ENG','BEL'],['MAPEH','CAP']],
      2: [['MAPEH','SUM'],['ENG','BEL'],['TLE','TAB'],['SCI','GUL'],['MATH','ACL'],['FIL','DIA'],['MATH','DEG'],['FIL','MAP'],['TLE','FAB'],['ARPAN','SUE'],['SCI','JAC']],
      3: [['VALED','FIE'],['TLE','TAB'],['ARPAN','DIA'],['MAPEH','SUM'],['ARPAN','FAB'],['SCI','GUL'],['ARPAN','SUE'],['MAPEH','CAP'],['VALED','ACO'],['SCI','JAC'],['MATH','ACL']],
      4: [['FIL','MAP'],['TLE','TAB'],['MAPEH','SUM'],['SCI','GUL'],['ENG','SAL'],['ARPAN','FAB'],['VALED','ACO'],['MATH','DEG'],['SCI','JAC'],['MATH','ACL'],['FIL','DIA']],
      5: [['TLE','TAB'],['MAPEH','SUM'],['VALED','FIE'],['ARPAN','FAB'],['MATH','ACL'],['FIL','DIA'],['MATH','DEG'],['ENG','ACO'],['ARPAN','SUE'],['MAPEH','CAP'],['ENG','BEL']],
    },
  },
  {
    start: '09:30', end: '10:30',
    days: {
      1: [['MATH','TAB'],['ENG','BEL'],['SCI','DEG'],['TLE','FIE'],['ENG','SAL'],['MAPEH','SUM'],['ARPAN','SUE'],['MAPEH','CAP'],['VALED','ACO'],['FIL','DIA'],['MATH','ACL']],
      2: [['FIL','MAP'],['FIL','ACL'],['MAPEH','SUM'],['TLE','FIE'],['FIL','HIS'],['SCI','GUL'],['MATH','DEG'],['SCI','JAC'],['TLE','FAB'],['MAPEH','CAP'],['ENG','BEL']],
      3: [['TLE','TAB'],['ARPAN','DIA'],['ENG','BEL'],['ENG','SAL'],['SCI','GUL'],['MATH','ACL'],['TLE','HIS'],['VALED','ACO'],['MATH','DEG'],['ARPAN','SUE'],['SCI','JAC']],
      4: [['ENG','BEL'],['VALED','FIE'],['TLE','TAB'],['SCI','GUL'],['MAPEH','SUM'],['ARPAN','FAB'],['TLE','HIS'],['MATH','DEG'],['FIL','MAP'],['FIL','DIA'],['MAPEH','CAP']],
      5: [['MAPEH','SUM'],['TLE','TAB'],['FIL','MAP'],['MATH','ACL'],['VALED','GUL'],['ENG','SAL'],['SCI','JAC'],['ARPAN','SUE'],['TLE','FAB'],['ENG','BEL'],['FIL','DIA']],
    },
  },
  {
    start: '10:30', end: '11:30',
    days: {
      1: [['SCI','DEG'],['FIL','ACL'],['ENG','BEL'],['ARPAN','FAB'],['TLE','FIE'],['FIL','DIA'],['ENG','SAL'],['VALED','ACO'],['SCI','JAC'],['MAPEH','CAP'],['ARPAN','SUE']],
      2: [['MAPEH','SUM'],['ARPAN','DIA'],['VALED','FIE'],['MATH','ACL'],['ARPAN','FAB'],['SCI','GUL'],['SCI','JAC'],['FIL','MAP'],['ENG','SAL'],['MAPEH','CAP'],['VALED','ACO']],
      3: [['ARPAN','DIA'],['MAPEH','SUM'],['MATH','TAB'],['SCI','GUL'],['FIL','HIS'],['TLE','FIE'],['ENG','SAL'],['ARPAN','SUE'],['MATH','DEG'],['SCI','JAC'],['TLE','FAB']],
      4: [['VALED','FIE'],['ENG','BEL'],['MAPEH','SUM'],['VALED','GUL'],['ARPAN','FAB'],['FIL','DIA'],['MATH','DEG'],['VALED','ACO'],['MAPEH','CAP'],['MATH','ACL'],['ARPAN','SUE']],
      5: [['MATH','TAB'],['ARPAN','DIA'],['SCI','DEG'],['TLE','FIE'],['ENG','SAL'],['VALED','GUL'],['ARPAN','SUE'],['SCI','JAC'],['FIL','MAP'],['MATH','ACL'],['VALED','ACO']],
    },
  },
  {
    start: '13:00', end: '14:00',
    days: {
      1: [['MATH','TAB'],['SCI','DEG'],['ARPAN','DIA'],['MAPEH','SUM'],['SCI','GUL'],['TLE','FIE'],['FIL','MAP'],['ARPAN','SUE'],['ENG','SAL'],['MATH','ACL'],['ENG','BEL']],
      2: [['FIL','MAP'],['MATH','TAB'],['ENG','BEL'],['MAPEH','SUM'],['FIL','HIS'],['ARPAN','FAB'],['SCI','JAC'],['MAPEH','CAP'],['VALED','ACO'],['FIL','DIA'],['ARPAN','SUE']],
      3: [['SCI','DEG'],['VALED','FIE'],['TLE','TAB'],['FIL','SUE'],['VALED','GUL'],['ENG','SAL'],['TLE','HIS'],['VALED','ACO'],['SCI','JAC'],['TLE','FAB'],['FIL','DIA']],
      4: [['ARPAN','DIA'],['SCI','DEG'],['MATH','TAB'],['ARPAN','FAB'],['TLE','FIE'],['MAPEH','SUM'],['ENG','SAL'],['TLE','HIS'],['MAPEH','CAP'],['VALED','ACO'],['MATH','ACL']],
      5: [['ENG','BEL'],['ARPAN','DIA'],['SCI','DEG'],['VALED','GUL'],['MATH','ACL'],['TLE','FIE'],['ENG','SAL'],['TLE','HIS'],['ARPAN','SUE'],['SCI','JAC'],['MAPEH','CAP']],
    },
  },
  {
    start: '14:00', end: '15:00',
    days: {
      1: [['ARPAN','DIA'],['VALED','FIE'],['ENG','BEL'],['ENG','SAL'],['MAPEH','SUM'],['VALED','GUL'],['VALED','ACO'],['MATH','DEG'],['TLE','FAB'],['ARPAN','SUE'],['MATH','ACL']],
      2: [['ENG','BEL'],['MATH','TAB'],['FIL','MAP'],['VALED','GUL'],['TLE','FIE'],['MAPEH','SUM'],['MAPEH','CAP'],['MATH','DEG'],['ENG','SAL'],['ARPAN','SUE'],['VALED','ACO']],
      3: [['VALED','FIE'],['SCI','DEG'],['MATH','TAB'],['MATH','ACL'],['ARPAN','FAB'],['VALED','GUL'],['TLE','HIS'],['ENG','ACO'],['FIL','MAP'],['FIL','DIA'],['SCI','JAC']],
      4: [['ARPAN','DIA'],['MATH','TAB'],['SCI','DEG'],['TLE','FIE'],['VALED','GUL'],['ENG','SAL'],['VALED','ACO'],['SCI','JAC'],['ARPAN','SUE'],['ENG','BEL'],['TLE','FAB']],
      5: null,
    },
  },
  {
    start: '15:00', end: '16:00',
    days: {
      1: [['VALED','FIE'],['MATH','TAB'],['FIL','MAP'],['VALED','GUL'],['MAPEH','SUM'],['MATH','ACL'],['MAPEH','CAP'],['TLE','HIS'],['MATH','DEG'],['TLE','FAB'],['FIL','DIA']],
      2: [['TLE','TAB'],['MAPEH','SUM'],['ARPAN','DIA'],['FIL','SUE'],['ENG','SAL'],['TLE','FIE'],['SCI','JAC'],['TLE','HIS'],['MAPEH','CAP'],['VALED','ACO'],['ENG','BEL']],
      3: [['SCI','DEG'],['VALED','FIE'],['TLE','TAB'],['MAPEH','SUM'],['VALED','GUL'],['MATH','ACL'],['MAPEH','CAP'],['ARPAN','SUE'],['ENG','SAL'],['TLE','FAB'],['VALED','ACO']],
      4: [['MATH','TAB'],['FIL','ACL'],['VALED','FIE'],['FIL','SUE'],['MAPEH','SUM'],['ENG','SAL'],['TLE','HIS'],['FIL','MAP'],['MATH','DEG'],['VALED','ACO'],['SCI','JAC']],
      5: null,
    },
  },
  {
    start: '16:00', end: '16:30',
    days: {
      1: allSpecial('ARAL Program (Reading)'),
      2: allSpecial('BULIG Program'),
      3: allSpecial('ARAL Program (Math)'),
      4: allSpecial('BUKMATHIX'),
      5: allSpecial('LAC Session'),
    },
  },
]

// ---------------------------------------------------------------------------
export async function runLampanusanNHSSeed() {
  const sqlite = new Database(resolve('./sked.db'))
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite, { schema })

  // 1. School
  const [school] = await db.insert(schools).values({
    name: 'Lampanusan National High School',
    address: 'Lampanusan, Philippines',
    phone: null,
    email: null,
  }).returning()
  console.log('✓ School created')

  // 2. Schedule type + JHS year levels + subjects
  const [scheduleType] = await db.insert(scheduleTypes).values({
    schoolId: school!.id,
    name: 'Junior High School',
  }).returning()

  const { yearLevels: insertedLevels } = await seedJHS(db, scheduleType!.id)
  console.log('✓ JHS year levels + subjects seeded')

  const ylMap: Record<string, number> = {}
  for (const yl of insertedLevels) {
    ylMap[`Grade ${yl.gradeNumber}`] = yl.id
  }

  const allSubjects = await db.select().from(subjects).where(eq(subjects.scheduleTypeId, scheduleType!.id))
  const subjMap: Record<string, number> = {}
  for (const s of allSubjects) {
    subjMap[s.name] = s.id
  }

  // 3. School year
  const [schoolYear] = await db.insert(schoolYears).values({
    schoolId: school!.id,
    scheduleTypeId: scheduleType!.id,
    label: '2026-2027',
    isActive: true,
  }).returning()
  console.log('✓ School year created')

  // 4. Teachers
  const teacherDefs: Array<{
    key: string
    maxHoursPerWeek: number
    assignments: Array<{ subj: string; grade: number; sectionCount: number }>
  }> = [
    { key: 'MAP', maxHoursPerWeek: 30, assignments: [{ subj: 'Filipino', grade: 7, sectionCount: 2 }, { subj: 'Filipino', grade: 9, sectionCount: 3 }] },
    { key: 'BEL', maxHoursPerWeek: 30, assignments: [{ subj: 'English', grade: 7, sectionCount: 3 }, { subj: 'English', grade: 10, sectionCount: 2 }] },
    { key: 'SUM', maxHoursPerWeek: 30, assignments: [{ subj: 'MAPEH', grade: 7, sectionCount: 3 }, { subj: 'MAPEH', grade: 8, sectionCount: 3 }] },
    { key: 'SAL', maxHoursPerWeek: 30, assignments: [{ subj: 'English', grade: 8, sectionCount: 3 }, { subj: 'English', grade: 9, sectionCount: 2 }] },
    { key: 'HIS', maxHoursPerWeek: 30, assignments: [{ subj: 'Filipino', grade: 8, sectionCount: 1 }, { subj: 'TLE', grade: 9, sectionCount: 2 }] },
    { key: 'GUL', maxHoursPerWeek: 30, assignments: [{ subj: 'Values Education', grade: 8, sectionCount: 3 }, { subj: 'Science', grade: 8, sectionCount: 3 }] },
    { key: 'ACO', maxHoursPerWeek: 30, assignments: [{ subj: 'Values Education', grade: 10, sectionCount: 2 }, { subj: 'Values Education', grade: 9, sectionCount: 3 }, { subj: 'English', grade: 9, sectionCount: 1 }] },
    { key: 'CAP', maxHoursPerWeek: 30, assignments: [{ subj: 'MAPEH', grade: 9, sectionCount: 3 }, { subj: 'MAPEH', grade: 10, sectionCount: 2 }] },
    { key: 'SUE', maxHoursPerWeek: 30, assignments: [{ subj: 'Araling Panlipunan', grade: 9, sectionCount: 3 }, { subj: 'Araling Panlipunan', grade: 10, sectionCount: 2 }, { subj: 'Filipino', grade: 8, sectionCount: 1 }] },
    { key: 'JAC', maxHoursPerWeek: 30, assignments: [{ subj: 'Science', grade: 9, sectionCount: 3 }, { subj: 'Science', grade: 10, sectionCount: 2 }] },
    { key: 'FAB', maxHoursPerWeek: 30, assignments: [{ subj: 'TLE', grade: 10, sectionCount: 2 }, { subj: 'Araling Panlipunan', grade: 8, sectionCount: 3 }, { subj: 'TLE', grade: 9, sectionCount: 1 }] },
    { key: 'ACL', maxHoursPerWeek: 30, assignments: [{ subj: 'Math', grade: 8, sectionCount: 3 }, { subj: 'Math', grade: 10, sectionCount: 2 }, { subj: 'Filipino', grade: 7, sectionCount: 1 }] },
    { key: 'FIE', maxHoursPerWeek: 30, assignments: [{ subj: 'TLE', grade: 8, sectionCount: 3 }, { subj: 'Values Education', grade: 7, sectionCount: 3 }] },
    { key: 'DIA', maxHoursPerWeek: 30, assignments: [{ subj: 'Araling Panlipunan', grade: 7, sectionCount: 3 }, { subj: 'Filipino', grade: 10, sectionCount: 2 }, { subj: 'Filipino', grade: 8, sectionCount: 1 }] },
    { key: 'TAB', maxHoursPerWeek: 30, assignments: [{ subj: 'Math', grade: 7, sectionCount: 3 }, { subj: 'TLE', grade: 7, sectionCount: 3 }] },
    { key: 'DEG', maxHoursPerWeek: 30, assignments: [{ subj: 'Science', grade: 7, sectionCount: 3 }, { subj: 'Math', grade: 9, sectionCount: 3 }] },
  ]

  const teacherIdMap: Record<string, string> = {}
  for (const def of teacherDefs) {
    const [teacher] = await db.insert(teachers).values({
      schoolId: school!.id,
      name: TEACHER_NAMES[def.key]!,
      maxHoursPerWeek: def.maxHoursPerWeek,
      maxHoursPerDay: Math.ceil(def.maxHoursPerWeek / 5),
    }).returning()
    teacherIdMap[def.key] = teacher!.id

    for (const a of def.assignments) {
      const ylId = ylMap[`Grade ${a.grade}`]
      const subjId = subjMap[a.subj]
      if (!ylId || !subjId) {
        console.warn(`  ⚠ Missing yl/subj for ${def.key}: ${a.subj} G${a.grade}`)
        continue
      }
      await db.insert(teacherSubjects).values({
        teacherId: teacher!.id,
        subjectId: subjId,
        yearLevelId: ylId,
        sectionCount: a.sectionCount,
      })
    }
  }
  console.log('✓ 16 teachers + subject assignments created')

  // 5. Sections
  const sectionDefs: Array<{ key: string; name: string; grade: number; adviserKey: string }> = [
    { key: 'G7Hope',  name: 'Grade 7 - Hope',  grade: 7,  adviserKey: 'MAP' },
    { key: 'G7Faith',  name: 'Grade 7 - Faith',  grade: 7,  adviserKey: 'BEL' },
    { key: 'G7Charity',  name: 'Grade 7 - Charity',  grade: 7,  adviserKey: 'SUM' },
    { key: 'G8Altair',  name: 'Grade 8 - Altair',  grade: 8,  adviserKey: 'SAL' },
    { key: 'G8Antares',  name: 'Grade 8 - Antares',  grade: 8,  adviserKey: 'HIS' },
    { key: 'G8Alhena',  name: 'Grade 8 - Alhena',  grade: 8,  adviserKey: 'GUL' },
    { key: 'G9Gold',  name: 'Grade 9 - Gold',  grade: 9,  adviserKey: 'ACO' },
    { key: 'G9Fuchsia',  name: 'Grade 9 - Fuchsia',  grade: 9,  adviserKey: 'CAP' },
    { key: 'G9Crimson',  name: 'Grade 9 - Crimson',  grade: 9,  adviserKey: 'SUE' },
    { key: 'G10Stalactite', name: 'Grade 10 - Stalactite', grade: 10, adviserKey: 'JAC' },
    { key: 'G10Helictite', name: 'Grade 10 - Helictite ', grade: 10, adviserKey: 'FAB' },
  ]

  const sectionIdMap: Record<string, string> = {}
  for (const def of sectionDefs) {
    const ylId = ylMap[`Grade ${def.grade}`]!
    const [section] = await db.insert(sections).values({
      schoolYearId: schoolYear!.id,
      yearLevelId: ylId,
      name: def.name,
      adviserId: teacherIdMap[def.adviserKey]!,
    }).returning()
    sectionIdMap[def.key] = section!.id
  }
  console.log('✓ 11 sections created')

  // 6. Schedule set
  const [scheduleSet] = await db.insert(scheduleSets).values({
    schoolYearId: schoolYear!.id,
    name: 'Draft Sched',
  }).returning()
  console.log('✓ Schedule set created')

  // 7. Schedule entries
  const entries: InsertEntry[] = []

  for (const slot of SCHEDULE) {
    for (const [dayStr, slotRow] of Object.entries(slot.days)) {
      const day = parseInt(dayStr)
      if (!slotRow) continue

      for (let i = 0; i < SECTIONS_ORDER.length; i++) {
        const sectionKey = SECTIONS_ORDER[i]!
        const cell = slotRow[i]
        if (!cell) continue

        const sectionId = sectionIdMap[sectionKey]!

        if ('special' in cell) {
          entries.push({
            scheduleSetId: scheduleSet!.id,
            sectionId,
            subjectId: null,
            teacherId: null,
            dayOfWeek: day,
            slotStartTime: slot.start,
            slotEndTime: slot.end,
            specialLabel: (cell as SpecialCell).special,
          })
        } else {
          const [subjAbbr, teacherKey] = cell as Cell
          const subjectName = SUBJECT_NAMES[subjAbbr!]
          const subjectId = subjectName ? (subjMap[subjectName] ?? null) : null
          const teacherId = teacherIdMap[teacherKey!] ?? null
          if (!subjectId) console.warn(`  ⚠ Unknown subject abbr: ${subjAbbr}`)
          if (!teacherId) console.warn(`  ⚠ Unknown teacher key: ${teacherKey}`)
          entries.push({
            scheduleSetId: scheduleSet!.id,
            sectionId,
            subjectId,
            teacherId,
            dayOfWeek: day,
            slotStartTime: slot.start,
            slotEndTime: slot.end,
            specialLabel: null,
          })
        }
      }
    }
  }

  for (let i = 0; i < entries.length; i += 100) {
    await db.insert(scheduleEntries).values(entries.slice(i, i + 100))
  }
  console.log(`✓ ${entries.length} schedule entries inserted`)

  // Break entries: Health Break, Ancillary Period, Noon Break for all sections
  const breakEntries: InsertEntry[] = []
  for (const sectionKey of SECTIONS_ORDER) {
    const sectionId = sectionIdMap[sectionKey]!
    for (const day of [1, 2, 3, 4, 5]) {
      breakEntries.push(
        { scheduleSetId: scheduleSet!.id, sectionId, subjectId: null, teacherId: null, dayOfWeek: day, slotStartTime: '09:00', slotEndTime: '09:30', specialLabel: 'Health Break' },
        { scheduleSetId: scheduleSet!.id, sectionId, subjectId: null, teacherId: null, dayOfWeek: day, slotStartTime: '11:30', slotEndTime: '12:00', specialLabel: 'Ancillary Period' },
        { scheduleSetId: scheduleSet!.id, sectionId, subjectId: null, teacherId: null, dayOfWeek: day, slotStartTime: '12:00', slotEndTime: '13:00', specialLabel: 'Noon Break' },
      )
    }
    // Friday LAC Session (afternoon 1–4 PM, three 1-hour slots)
    for (const hour of [14, 15]) {
      breakEntries.push({ scheduleSetId: scheduleSet!.id, sectionId, subjectId: null, teacherId: null, dayOfWeek: 5, slotStartTime: `${hour}:00`, slotEndTime: `${hour + 1}:00`, specialLabel: 'LAC Session' })
    }
  }
  for (let i = 0; i < breakEntries.length; i += 100) {
    await db.insert(scheduleEntries).values(breakEntries.slice(i, i + 100))
  }
  console.log(`✓ ${breakEntries.length} break/recess/lunch entries inserted`)

  sqlite.close()
}
