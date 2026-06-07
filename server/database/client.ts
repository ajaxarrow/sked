import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'
import { resolve, join } from 'path'
import { existsSync, copyFileSync } from 'fs'

function resolveDbPath(): string {
  if (process.env.DATABASE_PATH) {
    // On first boot with a fresh persistent disk, seed from the committed snapshot
    if (!existsSync(process.env.DATABASE_PATH)) {
      const seed = join(process.cwd(), 'sked.db')
      if (existsSync(seed)) copyFileSync(seed, process.env.DATABASE_PATH)
    }
    return process.env.DATABASE_PATH
  }
  return resolve('./sked.db')
}

const dbPath = resolveDbPath()
const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

migrate(db, { migrationsFolder: resolve('./server/database/migrations') })
