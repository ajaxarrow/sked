import Database from 'better-sqlite3'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import { migrate as migrateSqlite } from 'drizzle-orm/better-sqlite3/migrator'
import postgres from 'postgres'
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js'
import * as schema from './schema.js'
import { resolve, join, dirname } from 'path'
import { existsSync, copyFileSync } from 'fs'
import { fileURLToPath } from 'url'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'

// Typed as SQLite DB for consistent TypeScript inference across the codebase.
// When DATABASE_URL is set the actual runtime value is a PostgresJsDatabase —
// the Drizzle query interface (.select, .insert, .update, .delete) is identical.
export let db: BetterSQLite3Database<typeof schema>

if (process.env.DATABASE_URL) {
  // ── PostgreSQL / Supabase ────────────────────────────────────────────────
  // prepare: false is required for Supabase's connection pooler (PgBouncer).
  const client = postgres(process.env.DATABASE_URL, { prepare: false })
  db = drizzlePg(client, { schema }) as unknown as BetterSQLite3Database<typeof schema>
  // Migration is run in server/plugins/db-migrate.ts on first server startup.
} else {
  // ── SQLite (default for development) ────────────────────────────────────
  function resolveDbPath(): string {
    if (process.env.DATABASE_PATH) {
      if (!existsSync(process.env.DATABASE_PATH)) {
        const here = dirname(fileURLToPath(import.meta.url))
        const candidates = ['/seed.db', join(process.cwd(), 'sked.db'), join(here, 'sked.db')]
        const seed = candidates.find(existsSync)
        if (seed) copyFileSync(seed, process.env.DATABASE_PATH)
      }
      return process.env.DATABASE_PATH
    }
    return resolve('./sked.db')
  }

  const dbPath = resolveDbPath()
  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  db = drizzleSqlite(sqlite, { schema })
  migrateSqlite(db, { migrationsFolder: resolve('./server/database/migrations') })
}
