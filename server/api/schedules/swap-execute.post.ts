import { db } from '~/server/database/client'
import { scheduleEntries } from '~/server/database/schema'
import { eq, and, isNull } from 'drizzle-orm'
interface SlotKey {
  dayOfWeek: number
  slotStartTime: string
}
export default defineEventHandler(async (event) => {
  const body = await readBody(event) as {
    scheduleSetId: string
    sectionId: string
    type: '2way' | '3way'
    slots: [SlotKey, SlotKey] | [SlotKey, SlotKey, SlotKey]
  }
  const { scheduleSetId, sectionId, type, slots } = body
  if (!scheduleSetId || !sectionId || !type || !slots?.length) {
    throw createError({ statusCode: 400, message: 'scheduleSetId, sectionId, type, slots are required' })
  }
  if (type === '2way' && slots.length !== 2) {
    throw createError({ statusCode: 400, message: '2-way swap requires exactly 2 slots' })
  }
  if (type === '3way' && slots.length !== 3) {
    throw createError({ statusCode: 400, message: '3-way swap requires exactly 3 slots' })
  }
  // Fetch the actual DB entries for each slot
  async function fetchEntry(slot: SlotKey) {
    const rows = await db
      .select()
      .from(scheduleEntries)
      .where(
        and(
          eq(scheduleEntries.scheduleSetId, scheduleSetId),
          eq(scheduleEntries.sectionId, sectionId),
          eq(scheduleEntries.dayOfWeek, slot.dayOfWeek),
          eq(scheduleEntries.slotStartTime, slot.slotStartTime),
          isNull(scheduleEntries.specialLabel),
        ),
      )
    if (rows.length === 0) {
      throw createError({ statusCode: 404, message: `Slot ${slot.dayOfWeek}/${slot.slotStartTime} not found or is a break` })
    }
    return rows[0]!
  }
  const entries = await Promise.all(slots.map(fetchEntry))
  // Snapshot current positions
  const positions = entries.map(e => ({
    id:            e.id,
    dayOfWeek:     e.dayOfWeek,
    slotStartTime: e.slotStartTime,
    slotEndTime:   e.slotEndTime,
  }))
  // Execute rotation: each entry moves to the NEXT entry's original position
  // 2-way: [0]→[1], [1]→[0]
  // 3-way: [0]→[1], [1]→[2], [2]→[0]
  // i.e. entry[i] takes position[i+1 mod n]
  const n = positions.length
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n
    await db
      .update(scheduleEntries)
      .set({
        dayOfWeek:     positions[next]!.dayOfWeek,
        slotStartTime: positions[next]!.slotStartTime,
        slotEndTime:   positions[next]!.slotEndTime,
      })
      .where(eq(scheduleEntries.id, positions[i]!.id))
  }
  return { ok: true }
})
