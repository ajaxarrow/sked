import { db } from '~/server/database/client'
import { schools } from '~/server/database/schema'

export default defineEventHandler(async () => {
  return db.select().from(schools).all()
})
