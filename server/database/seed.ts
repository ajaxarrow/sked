import { yearLevels, subjects } from './schema'

const JHS_YEAR_LEVELS = [
  { name: 'Grade 7',  gradeNumber: 7,  sortOrder: 1 },
  { name: 'Grade 8',  gradeNumber: 8,  sortOrder: 2 },
  { name: 'Grade 9',  gradeNumber: 9,  sortOrder: 3 },
  { name: 'Grade 10', gradeNumber: 10, sortOrder: 4 },
]

const JHS_SUBJECTS = [
  { name: 'English',            colorHex: '#3b82f6', hoursPerWeek: 4 },
  { name: 'Filipino',           colorHex: '#22c55e', hoursPerWeek: 4 },
  { name: 'Math',               colorHex: '#ef4444', hoursPerWeek: 4 },
  { name: 'Science',            colorHex: '#a855f7', hoursPerWeek: 4 },
  { name: 'Araling Panlipunan', colorHex: '#f97316', hoursPerWeek: 4 },
  { name: 'Values Education',   colorHex: '#eab308', hoursPerWeek: 4 },
  { name: 'MAPEH',              colorHex: '#ec4899', hoursPerWeek: 4 },
  { name: 'TLE',                colorHex: '#14b8a6', hoursPerWeek: 4 },
]

const SHS_YEAR_LEVELS = [
  { name: 'Grade 11', gradeNumber: 11, sortOrder: 1 },
  { name: 'Grade 12', gradeNumber: 12, sortOrder: 2 },
]

const SHS_SUBJECTS = [
  { name: 'Oral Communication',                colorHex: '#3b82f6', hoursPerWeek: 4 },
  { name: 'Reading and Writing',               colorHex: '#22c55e', hoursPerWeek: 4 },
  { name: 'Filipino',                          colorHex: '#a855f7', hoursPerWeek: 4 },
  { name: 'Mathematics',                       colorHex: '#ef4444', hoursPerWeek: 4 },
  { name: 'Science',                           colorHex: '#f97316', hoursPerWeek: 4 },
  { name: 'Contemporary Philippine Arts',      colorHex: '#ec4899', hoursPerWeek: 4 },
  { name: 'Understanding Culture, Soc. & Pol', colorHex: '#eab308', hoursPerWeek: 4 },
  { name: 'Physical Education and Health',     colorHex: '#14b8a6', hoursPerWeek: 4 },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function seedJHS(database: any, scheduleTypeId: number) {
  const insertedLevels = await database
    .insert(yearLevels)
    .values(JHS_YEAR_LEVELS.map(l => ({ ...l, scheduleTypeId })))
    .returning()

  await database
    .insert(subjects)
    .values(JHS_SUBJECTS.map(s => ({ ...s, scheduleTypeId })))

  return { yearLevels: insertedLevels }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function seedSHS(database: any, scheduleTypeId: number) {
  const insertedLevels = await database
    .insert(yearLevels)
    .values(SHS_YEAR_LEVELS.map(l => ({ ...l, scheduleTypeId })))
    .returning()

  await database
    .insert(subjects)
    .values(SHS_SUBJECTS.map(s => ({ ...s, scheduleTypeId })))

  return { yearLevels: insertedLevels }
}
