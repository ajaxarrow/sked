import { db } from '~/server/database/client'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { resolve } from 'path'

export default defineNitroPlugin(async () => {
  if (!process.env.DATABASE_URL) return
  await migrate(db as any, { migrationsFolder: resolve('./server/database/migrations-pg') })
})
