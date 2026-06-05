import { yearLevels, subjects } from './schema'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import type * as schema from './schema'

const JHS_YEAR_LEVELS = [
  { name: 'Grade 7', gradeNumber: 7, sortOrder: 1 },
  { name: 'Grade 8', gradeNumber: 8, sortOrder: 2 },
  { name: 'Grade 9', gradeNumber: 9, sortOrder: 3 },
  { name: 'Grade 10', gradeNumber: 10, sortOrder: 4 },
]

const JHS_SUBJECTS = [
  { name: 'English', colorHex: '#3b82f6' },
  { name: 'Filipino', colorHex: '#22c55e' },
  { name: 'Math', colorHex: '#ef4444' },
  { name: 'Science', colorHex: '#a855f7' },
  { name: 'Araling Panlipunan', colorHex: '#f97316' },
  { name: 'Values Education', colorHex: '#eab308' },
  { name: 'MAPEH', colorHex: '#ec4899' },
  { name: 'TLE', colorHex: '#14b8a6' },
]

export async function seedJHS(database: BetterSQLite3Database<typeof schema>, scheduleTypeId: number) {
  const insertedLevels = await database
    .insert(yearLevels)
    .values(JHS_YEAR_LEVELS.map(l => ({ ...l, scheduleTypeId })))
    .returning()

  await database
    .insert(subjects)
    .values(JHS_SUBJECTS.map(s => ({ ...s, scheduleTypeId, hoursPerWeek: 4 })))

  return { yearLevels: insertedLevels }
}
