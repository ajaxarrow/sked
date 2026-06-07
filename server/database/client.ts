import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'
import { resolve, join, dirname } from 'path'
import { existsSync, copyFileSync } from 'fs'
import { fileURLToPath } from 'url'

function resolveDbPath(): string {
  if (process.env.DATABASE_PATH) {
    if (!existsSync(process.env.DATABASE_PATH)) {
      const here = typeof __dirname !== 'undefined'
        ? __dirname
        : dirname(fileURLToPath(import.meta.url))
      const candidates = ['/seed.db', join(process.cwd(), 'sked.db'), join(here, 'sked.db')]
      const seed = candidates.find(existsSync)
      // If a seed exists copy it; otherwise SQLite creates a fresh DB and migrations set up the schema
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

export const db = drizzle(sqlite, { schema })

migrate(db, { migrationsFolder: resolve('./server/database/migrations') })
