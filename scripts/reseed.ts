/**
 * Clears all application data without dropping tables, then re-seeds.
 * Safe for both SQLite and PostgreSQL / Supabase.
 *
 * Deletion order respects FK constraints; deleting `schools` cascades
 * to every child table, so one statement is enough.
 */
import 'dotenv/config'
import { runLampanusanNHSSeed } from '../server/database/lampanusan-nhs-seed.js'
import * as schema from '../server/database/schema.js'

const DATABASE_URL = process.env.DATABASE_URL

if (DATABASE_URL) {
  // ── PostgreSQL / Supabase ──────────────────────────────────────────────────
  const { default: postgres } = await import('postgres')
  const { drizzle } = await import('drizzle-orm/postgres-js')
  const client = postgres(DATABASE_URL, { prepare: false })
  const db = drizzle(client, { schema })

  console.log('Clearing data…')
  // schedule_entries must go first — its teacher_id FK has no ON DELETE CASCADE
  await db.delete(schema.scheduleEntries)
  await db.delete(schema.schools) // cascades: schedule_types, year_levels, subjects, teachers, school_years, sections, schedule_sets
  console.log('✓ All data cleared')

  await runLampanusanNHSSeed(db)
  await client.end()
} else {
  // ── SQLite (local dev) ─────────────────────────────────────────────────────
  const { default: Database } = await import('better-sqlite3')
  const { drizzle } = await import('drizzle-orm/better-sqlite3')
  const { resolve } = await import('path')

  const sqlite = new Database(resolve('./sked.db'))
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite, { schema })

  console.log('Clearing data…')
  db.delete(schema.scheduleEntries).run()
  db.delete(schema.schools).run()
  console.log('✓ All data cleared')

  await runLampanusanNHSSeed(db)
  sqlite.close()
}

console.log('✓ Reseed complete')
process.exit(0)
