import 'dotenv/config'
import { runLampanusanNHSSeed } from '../server/database/lampanusan-nhs-seed.js'
import * as schema from '../server/database/schema.js'

const DATABASE_URL = process.env.DATABASE_URL

if (DATABASE_URL) {
  // ── PostgreSQL / Supabase ──────────────────────────────────────────────────
  const { default: postgres } = await import('postgres')
  const { drizzle } = await import('drizzle-orm/postgres-js')
  const { migrate } = await import('drizzle-orm/postgres-js/migrator')
  const { resolve } = await import('path')

  const client = postgres(DATABASE_URL, { prepare: false })
  const db = drizzle(client, { schema })
  await migrate(db, { migrationsFolder: resolve('./server/database/migrations-pg') })
  await runLampanusanNHSSeed(db)
  await client.end()
} else {
  // ── SQLite (default for development) ──────────────────────────────────────
  const { default: Database } = await import('better-sqlite3')
  const { drizzle } = await import('drizzle-orm/better-sqlite3')
  const { migrate } = await import('drizzle-orm/better-sqlite3/migrator')
  const { resolve } = await import('path')

  const sqlite = new Database(resolve('./sked.db'))
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder: resolve('./server/database/migrations') })
  await runLampanusanNHSSeed(db)
  sqlite.close()
}

console.log('✓ Seed complete')
process.exit(0)
