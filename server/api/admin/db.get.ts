import { readFileSync } from 'fs'

export default defineEventHandler((event) => {
  const { token } = getQuery(event)
  if (token !== 'jiuaxl123') {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const dbPath = process.env.DATABASE_PATH ?? './sked.db'
  const data = readFileSync(dbPath)

  setHeader(event, 'Content-Type', 'application/octet-stream')
  setHeader(event, 'Content-Disposition', 'attachment; filename="sked.db"')
  setHeader(event, 'Content-Length', data.length)

  return data
})
