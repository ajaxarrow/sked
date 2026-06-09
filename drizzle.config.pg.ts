import { defineConfig } from 'drizzle-kit'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set to use the PostgreSQL drizzle config')
}

export default defineConfig({
  schema: './server/database/schema.ts',
  out: './server/database/migrations-pg',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL },
})
