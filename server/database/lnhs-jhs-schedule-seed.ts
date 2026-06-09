import { scheduleSets, scheduleEntries } from './schema.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any

const TEACHER_KEY_TO_NAME: Record<string, string> = {
  MAP: 'MAPALAD', BEL: 'BELGIRA', SUM: 'SUMALPONG', SAL: 'SALAR',
  HIS: 'HISANAN', GUL: 'GULAYAN', ACO: 'ACOP', CAP: 'CAPADA',
  SUE: 'SUELA', JAC: 'JACALAN', FAB: 'FABRE', ACL: 'ACLARACION',
  FIE: 'FIEL', DIA: 'DIAZ', TAB: 'TABILLA', DEG: 'DE GUZMAN',
}

const SECTION_KEYS = [
  'G7Faith', 'G7Hope', 'G7Love',
  'G8Alhena', 'G8Altair', 'G8Antares',
  'G9Crimson', 'G9Fuchsia', 'G9Gold',
  'G10Helictite', 'G10Stalactite',
] as const

const LAC = 'LAC Session/CE/Curricular, Co-Curricular/Extracurricular Activities'
const ALL_LAC = Array(11).fill(`@${LAC}`).join('\t')

// Rows: [day, start, end, ...11 section entries (tab-separated)]
// Entry: 'Subject/Teacher' for subject slots, '@Special Label' for non-subject blocks
const SCHEDULE_ROWS: Array<[number, string, string, ...string[]]> = [
  // ── Monday 7:00–8:00  Flag Ceremony ────────────────────────────────────────
  [1, '07:00', '08:00', '@Flag Ceremony / RHGP', '@Flag Ceremony / RHGP', '@Flag Ceremony / RHGP', '@Flag Ceremony / RHGP', '@Flag Ceremony / RHGP', '@Flag Ceremony / RHGP', '@Flag Ceremony / RHGP', '@Flag Ceremony / RHGP', '@Flag Ceremony / RHGP', '@Flag Ceremony / RHGP', '@Flag Ceremony / RHGP'],

  // ── 7:00–8:00  Tue – Fri  (same subject+teacher all 4 days) ───────────────
  [2, '07:00', '08:00', 'English/BELGIRA', 'Filipino/MAPALAD', 'MAPEH/SUMALPONG', 'Science/GULAYAN', 'English/SALAR', 'Filipino/HISANAN', 'Araling Panlipunan/SUELA', 'MAPEH/CAPADA', 'English/ACOP', 'TLE/FABRE', 'Science/JACALAN'],
  [3, '07:00', '08:00', 'English/BELGIRA', 'Filipino/MAPALAD', 'MAPEH/SUMALPONG', 'Science/GULAYAN', 'English/SALAR', 'Filipino/HISANAN', 'Araling Panlipunan/SUELA', 'MAPEH/CAPADA', 'English/ACOP', 'TLE/FABRE', 'Science/JACALAN'],
  [4, '07:00', '08:00', 'English/BELGIRA', 'Filipino/MAPALAD', 'MAPEH/SUMALPONG', 'Science/GULAYAN', 'English/SALAR', 'Filipino/HISANAN', 'Araling Panlipunan/SUELA', 'MAPEH/CAPADA', 'English/ACOP', 'TLE/FABRE', 'Science/JACALAN'],
  [5, '07:00', '08:00', 'English/BELGIRA', 'Filipino/MAPALAD', 'MAPEH/SUMALPONG', 'Science/GULAYAN', 'English/SALAR', 'Filipino/HISANAN', 'Araling Panlipunan/SUELA', 'MAPEH/CAPADA', 'English/ACOP', 'TLE/FABRE', 'Science/JACALAN'],

  // ── 8:00–9:00 ──────────────────────────────────────────────────────────────
  [1, '08:00', '09:00', 'Araling Panlipunan/DIAZ', 'English/BELGIRA', 'Math/TABILLA', 'TLE/FIEL', 'MAPEH/SUMALPONG', 'Araling Panlipunan/FABRE', 'TLE/HISANAN', 'Values Education/ACOP', 'Araling Panlipunan/SUELA', 'Science/JACALAN', 'Math/ACLARACION'],
  [2, '08:00', '09:00', 'MAPEH/SUMALPONG', 'Araling Panlipunan/DIAZ', 'TLE/TABILLA', 'Filipino/SUELA', 'Values Education/GULAYAN', 'TLE/FIEL', 'MAPEH/CAPADA', 'Filipino/MAPALAD', 'Math/GUZMAN', 'Math/ACLARACION', 'English/BELGIRA'],
  [3, '08:00', '09:00', 'Science/GUZMAN', 'TLE/TABILLA', 'Filipino/ACLARACION', 'Araling Panlipunan/FABRE', 'TLE/FIEL', 'Values Education/GULAYAN', 'TLE/HISANAN', 'Araling Panlipunan/SUELA', 'MAPEH/CAPADA', 'Filipino/DIAZ', 'Values Education/ACOP'],
  [4, '08:00', '09:00', 'Values Education/FIEL', 'Araling Panlipunan/DIAZ', 'Math/TABILLA', 'English/SALAR', 'Values Education/GULAYAN', 'Math/ACLARACION', 'MAPEH/CAPADA', 'Values Education/ACOP', 'Math/GUZMAN', 'Science/JACALAN', 'TLE/FABRE'],
  [5, '08:00', '09:00', 'MAPEH/SUMALPONG', 'Science/GUZMAN', 'Araling Panlipunan/DIAZ', 'Araling Panlipunan/FABRE', 'Math/ACLARACION', 'Values Education/GULAYAN', 'English/SALAR', 'TLE/HISANAN', 'Science/JACALAN', 'Araling Panlipunan/SUELA', 'English/BELGIRA'],

  // ── 9:30–10:30 ─────────────────────────────────────────────────────────────
  [1, '09:30', '10:30', 'Values Education/FIEL', 'TLE/TABILLA', 'Araling Panlipunan/DIAZ', 'Filipino/SUELA', 'Science/GULAYAN', 'English/SALAR', 'Science/JACALAN', 'TLE/HISANAN', 'Math/GUZMAN', 'Values Education/ACOP', 'English/BELGIRA'],
  [2, '09:30', '10:30', 'TLE/TABILLA', 'English/BELGIRA', 'Science/GUZMAN', 'TLE/FIEL', 'Filipino/DIAZ', 'Science/GULAYAN', 'Filipino/MAPALAD', 'English/SALAR', 'Values Education/ACOP', 'Araling Panlipunan/SUELA', 'TLE/FABRE'],
  [3, '09:30', '10:30', 'Filipino/MAPALAD', 'Math/TABILLA', 'Values Education/FIEL', 'Filipino/SUELA', 'MAPEH/SUMALPONG', 'Math/ACLARACION', 'English/SALAR', 'TLE/HISANAN', 'Math/GUZMAN', 'MAPEH/CAPADA', 'Filipino/DIAZ'],
  [4, '09:30', '10:30', 'Araling Panlipunan/DIAZ', 'MAPEH/SUMALPONG', 'Science/GUZMAN', 'Math/ACLARACION', 'Araling Panlipunan/FABRE', 'TLE/FIEL', 'Science/JACALAN', 'English/SALAR', 'Araling Panlipunan/SUELA', 'English/BELGIRA', 'Values Education/ACOP'],
  [5, '09:30', '10:30', 'Filipino/MAPALAD', 'Math/TABILLA', 'Science/GUZMAN', 'MAPEH/SUMALPONG', 'Filipino/DIAZ', 'English/SALAR', 'TLE/HISANAN', 'Araling Panlipunan/SUELA', 'Values Education/ACOP', 'Science/JACALAN', 'Math/ACLARACION'],

  // ── 10:30–11:30 ────────────────────────────────────────────────────────────
  [1, '10:30', '11:30', 'TLE/TABILLA', 'Araling Panlipunan/DIAZ', 'English/BELGIRA', 'Math/ACLARACION', 'TLE/FIEL', 'Values Education/GULAYAN', 'Math/GUZMAN', 'Filipino/MAPALAD', 'Science/JACALAN', 'Araling Panlipunan/SUELA', 'MAPEH/CAPADA'],
  [2, '10:30', '11:30', 'Math/TABILLA', 'Science/GUZMAN', 'Values Education/FIEL', 'Values Education/GULAYAN', 'MAPEH/SUMALPONG', 'Math/ACLARACION', 'English/SALAR', 'TLE/HISANAN', 'MAPEH/CAPADA', 'Values Education/ACOP', 'Araling Panlipunan/SUELA'],
  [3, '10:30', '11:30', 'MAPEH/SUMALPONG', 'Araling Panlipunan/DIAZ', 'TLE/TABILLA', 'Math/ACLARACION', 'Values Education/GULAYAN', 'TLE/FIEL', 'Math/GUZMAN', 'Filipino/MAPALAD', 'Values Education/ACOP', 'English/BELGIRA', 'TLE/FABRE'],
  [4, '10:30', '11:30', 'Filipino/MAPALAD', 'English/BELGIRA', 'Araling Panlipunan/DIAZ', 'MAPEH/SUMALPONG', 'TLE/FIEL', 'Science/GULAYAN', 'Math/GUZMAN', 'Science/JACALAN', 'TLE/FABRE', 'MAPEH/CAPADA', 'Math/ACLARACION'],
  [5, '10:30', '11:30', 'TLE/TABILLA', 'Values Education/FIEL', 'Filipino/ACLARACION', 'English/SALAR', 'MAPEH/SUMALPONG', 'Araling Panlipunan/FABRE', 'Science/JACALAN', 'Math/GUZMAN', 'Filipino/MAPALAD', 'Filipino/DIAZ', 'Araling Panlipunan/SUELA'],

  // ── 1:00–2:00 PM ───────────────────────────────────────────────────────────
  [1, '13:00', '14:00', 'Filipino/MAPALAD', 'Values Education/FIEL', 'TLE/TABILLA', 'English/SALAR', 'Filipino/DIAZ', 'MAPEH/SUMALPONG', 'MAPEH/CAPADA', 'Math/GUZMAN', 'TLE/FABRE', 'English/BELGIRA', 'Araling Panlipunan/SUELA'],
  [2, '13:00', '14:00', 'Values Education/FIEL', 'MAPEH/SUMALPONG', 'Math/TABILLA', 'Math/ACLARACION', 'Araling Panlipunan/FABRE', 'English/SALAR', 'Values Education/ACOP', 'Science/JACALAN', 'Filipino/MAPALAD', 'Filipino/DIAZ', 'MAPEH/CAPADA'],
  [3, '13:00', '14:00', 'Araling Panlipunan/DIAZ', 'Values Education/FIEL', 'Science/GUZMAN', 'English/SALAR', 'Science/GULAYAN', 'MAPEH/SUMALPONG', 'MAPEH/CAPADA', 'Values Education/ACOP', 'Araling Panlipunan/SUELA', 'Science/JACALAN', 'Math/ACLARACION'],
  [4, '13:00', '14:00', 'MAPEH/SUMALPONG', 'TLE/TABILLA', 'Values Education/FIEL', 'Values Education/GULAYAN', 'Math/ACLARACION', 'Araling Panlipunan/FABRE', 'Filipino/MAPALAD', 'Math/GUZMAN', 'MAPEH/CAPADA', 'Values Education/ACOP', 'English/BELGIRA'],
  [5, '13:00', '14:00', 'Math/TABILLA', 'MAPEH/SUMALPONG', 'English/BELGIRA', 'Filipino/SUELA', 'TLE/FIEL', 'Science/GULAYAN', 'Math/GUZMAN', 'English/SALAR', 'TLE/FABRE', 'Math/ACLARACION', 'Filipino/DIAZ'],

  // ── 2:00–3:00 PM  (Mon–Thu; Fri is LAC — see REPEAT_SPECIALS) ──────────────
  [1, '14:00', '15:00', 'Science/GUZMAN', 'Math/TABILLA', 'Values Education/FIEL', 'MAPEH/SUMALPONG', 'Values Education/GULAYAN', 'Math/ACLARACION', 'Values Education/ACOP', 'Science/JACALAN', 'Filipino/MAPALAD', 'MAPEH/CAPADA', 'TLE/FABRE'],
  [2, '14:00', '15:00', 'Araling Panlipunan/DIAZ', 'TLE/TABILLA', 'Filipino/ACLARACION', 'Araling Panlipunan/FABRE', 'Science/GULAYAN', 'MAPEH/SUMALPONG', 'Science/JACALAN', 'Math/GUZMAN', 'Araling Panlipunan/SUELA', 'English/BELGIRA', 'Values Education/ACOP'],
  [3, '14:00', '15:00', 'Values Education/FIEL', 'English/BELGIRA', 'Math/TABILLA', 'Values Education/GULAYAN', 'Math/ACLARACION', 'Araling Panlipunan/FABRE', 'Filipino/MAPALAD', 'English/SALAR', 'Science/JACALAN', 'Values Education/ACOP', 'MAPEH/CAPADA'],
  [4, '14:00', '15:00', 'TLE/TABILLA', 'Science/GUZMAN', 'English/BELGIRA', 'TLE/FIEL', 'Science/GULAYAN', 'MAPEH/SUMALPONG', 'English/SALAR', 'Araling Panlipunan/SUELA', 'Values Education/ACOP', 'Math/ACLARACION', 'Filipino/DIAZ'],

  // ── 3:00–4:00 PM  (Mon–Thu; Fri is LAC — see REPEAT_SPECIALS) ──────────────
  [1, '15:00', '16:00', 'Math/TABILLA', 'Science/GUZMAN', 'Filipino/ACLARACION', 'Values Education/GULAYAN', 'Araling Panlipunan/FABRE', 'TLE/FIEL', 'Filipino/MAPALAD', 'Araling Panlipunan/SUELA', 'MAPEH/CAPADA', 'Filipino/DIAZ', 'Values Education/ACOP'],
  [2, '15:00', '16:00', 'Science/GUZMAN', 'Math/TABILLA', 'English/BELGIRA', 'MAPEH/SUMALPONG', 'Math/ACLARACION', 'Values Education/GULAYAN', 'TLE/HISANAN', 'Values Education/ACOP', 'TLE/FABRE', 'MAPEH/CAPADA', 'Filipino/DIAZ'],
  [3, '15:00', '16:00', 'Math/TABILLA', 'MAPEH/SUMALPONG', 'Araling Panlipunan/DIAZ', 'TLE/FIEL', 'Araling Panlipunan/FABRE', 'Science/GULAYAN', 'Values Education/ACOP', 'Science/JACALAN', 'Filipino/MAPALAD', 'Math/ACLARACION', 'Araling Panlipunan/SUELA'],
  [4, '15:00', '16:00', 'Science/GUZMAN', 'Values Education/FIEL', 'TLE/TABILLA', 'Araling Panlipunan/FABRE', 'Filipino/DIAZ', 'English/SALAR', 'Values Education/ACOP', 'Filipino/MAPALAD', 'Science/JACALAN', 'Araling Panlipunan/SUELA', 'MAPEH/CAPADA'],
]

// Non-subject blocks that repeat across all sections
// [days[], start, end, specialLabel]
const REPEAT_SPECIALS: Array<[number[], string, string, string]> = [
  [[1, 2, 3, 4, 5], '09:00', '09:30', 'Health Break'],
  [[1, 2, 3, 4, 5], '11:30', '12:00', 'Ancillary'],
  [[1, 2, 3, 4, 5], '12:00', '13:00', 'Lunch Break'],
  // Friday LAC — three separate slots kept distinct as requested
  [[5], '14:00', '15:00', LAC],
  [[5], '15:00', '16:00', LAC],
  [[5], '16:00', '16:30', LAC],
  // Mon–Thu 4:00–4:30 PM programs
  [[1], '16:00', '16:30', 'ARAL PROGRAM (READING)'],
  [[2], '16:00', '16:30', 'BULIG PROGRAM'],
  [[3], '16:00', '16:30', 'ARAL PROGRAM (MATH)'],
  [[4], '16:00', '16:30', 'BUKMATHIX'],
]

export async function seedLNHSJHSSchedule(
  db: DB,
  schoolYearId: string,
  teacherIdMap: Record<string, string>,
  sectionIdMap: Record<string, string>,
  subjMap: Record<string, number>,
) {
  // Build name → UUID map for teachers
  const teacherByName: Record<string, string> = {}
  for (const [key, id] of Object.entries(teacherIdMap)) {
    teacherByName[TEACHER_KEY_TO_NAME[key]!] = id
  }
  // Schedule uses 'GUZMAN'; DB stores 'DE GUZMAN'
  teacherByName['GUZMAN'] = teacherByName['DE GUZMAN']!

  const [scheduleSet] = await db.insert(scheduleSets).values({
    schoolYearId,
    name: 'LNHS JUNIOR HIGH SCHOOL SCHEDULE 2026-2027',
  }).returning()
  const setId = scheduleSet!.id

  type EntryRow = {
    scheduleSetId: string
    sectionId: string
    subjectId: number | null
    teacherId: string | null
    dayOfWeek: number
    slotStartTime: string
    slotEndTime: string
    specialLabel: string | null
  }

  const allEntries: EntryRow[] = []

  // Process subject/special rows from the schedule table
  for (const [day, start, end, ...cells] of SCHEDULE_ROWS) {
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i]!
      const sectionKey = SECTION_KEYS[i]!
      const sectionId = sectionIdMap[sectionKey]
      if (!sectionId) { console.warn(`⚠ Missing section: ${sectionKey}`); continue }

      if (cell.startsWith('@')) {
        allEntries.push({ scheduleSetId: setId, sectionId, subjectId: null, teacherId: null, dayOfWeek: day, slotStartTime: start, slotEndTime: end, specialLabel: cell.slice(1) })
      } else {
        const slash = cell.lastIndexOf('/')
        const subject = cell.slice(0, slash)
        const teacher = cell.slice(slash + 1)
        const subjectId = subjMap[subject] ?? null
        const teacherId = teacherByName[teacher] ?? null
        if (!subjectId) console.warn(`⚠ Unknown subject: ${subject}`)
        if (!teacherId) console.warn(`⚠ Unknown teacher: ${teacher}`)
        allEntries.push({ scheduleSetId: setId, sectionId, subjectId, teacherId, dayOfWeek: day, slotStartTime: start, slotEndTime: end, specialLabel: null })
      }
    }
  }

  // Process repeat specials (Health Break, Ancillary, Lunch, LAC, programs)
  for (const [days, start, end, label] of REPEAT_SPECIALS) {
    for (const day of days) {
      for (const sectionKey of SECTION_KEYS) {
        allEntries.push({ scheduleSetId: setId, sectionId: sectionIdMap[sectionKey]!, subjectId: null, teacherId: null, dayOfWeek: day, slotStartTime: start, slotEndTime: end, specialLabel: label })
      }
    }
  }

  // Batch insert in chunks to stay within SQLite variable limits
  const CHUNK = 100
  for (let i = 0; i < allEntries.length; i += CHUNK) {
    await db.insert(scheduleEntries).values(allEntries.slice(i, i + CHUNK))
  }

  console.log(`✓ ${allEntries.length} schedule entries seeded (LNHS JHS 2026-2027)`)
}
