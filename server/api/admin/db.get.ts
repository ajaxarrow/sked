import { readFileSync } from 'fs'
export default defineEventHandler((event) => {
  const { token } = getQuery(event)
  if (token !== 'jiuaxl123') {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  if (process.env.DATABASE_URL) {
    throw createError({ statusCode: 400, message: 'Database download is not available when using PostgreSQL. Use Supabase dashboard to export data.' })
  }
  const dbPath = process.env.DATABASE_PATH ?? './sked.db'
  const data = readFileSync(dbPath)
  setHeader(event, 'Content-Type', 'application/octet-stream')
  setHeader(event, 'Content-Disposition', 'attachment; filename="sked.db"')
  setHeader(event, 'Content-Length', data.length)
  return data
})
