import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { eq } from 'drizzle-orm'
import { resolve } from 'path'
import * as schema from './schema.js'
import { seedJHS } from './seed.js'

const {
  schools, scheduleTypes, schoolYears, teachers, teacherSubjects,
  yearLevels, subjects, sections,
} = schema

// ---------------------------------------------------------------------------
// Lookup tables
// ---------------------------------------------------------------------------
const TEACHER_NAMES: Record<string, string> = {
  MAP: 'MAPALAD', BEL: 'BELGIRA', SUM: 'SUMALPONG', SAL: 'SALAR',
  HIS: 'HISANAN', GUL: 'GULAYAN', ACO: 'ACOP', CAP: 'CAPADA',
  SUE: 'SUELA', JAC: 'JACALAN', FAB: 'FABRE', ACL: 'ACLARACION',
  FIE: 'FIEL', DIA: 'DIAZ', TAB: 'TABILLA', DEG: 'DE GUZMAN',
}

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
    { key: 'G7Love',  name: 'Grade 7 - Love',  grade: 7,  adviserKey: 'SUM' },
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

  console.log('✓ Seed complete')

  sqlite.close()
}
