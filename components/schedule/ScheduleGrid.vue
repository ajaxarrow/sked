<template>
  <div class="card overflow-hidden">
    <div class="overflow-x-auto">
      <table class="schedule-table">
        <thead>
          <tr>
            <th style="width: 6rem">Time</th>
            <th v-for="day in DAYS" :key="day.num" style="min-width: 9rem; text-align: center">
              {{ day.label }}
            </th>
            <th style="min-width: 11rem">Vacant Teachers</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="slot in timeSlots" :key="slot.start">
            <td style="white-space: nowrap; color: var(--color-muted)">
              <span class="font-medium text-xs" style="color: var(--color-ink)">{{ formatTime(slot.start) }}</span>
              <span class="text-xs mx-0.5" style="color: var(--color-border-strong)">–</span>
              <span class="text-xs">{{ formatTime(slot.end) }}</span>
            </td>
            <td v-for="day in DAYS" :key="day.num" style="text-align: center">
              <!-- Special label (health break, lunch, flag ceremony, etc.) -->
              <div v-if="getSpecial(day.num, slot.start)" class="special-label-cell" :class="specialClass(getSpecial(day.num, slot.start)!.specialLabel!)">
                {{ getSpecial(day.num, slot.start)!.specialLabel }}
              </div>
              <!-- Subject entry -->
              <div
                v-else-if="getEntry(day.num, slot.start)"
                class="schedule-cell schedule-cell--clickable"
                :class="{ 'schedule-cell--selected': props.selectedDay === day.num && props.selectedTime === slot.start }"
                :style="{ background: (getEntry(day.num, slot.start)?.subjectColor ?? '#6366f1') + '22', color: getEntry(day.num, slot.start)?.subjectColor ?? 'var(--color-ink)' }"
                title="Click to find conflict-free swap options"
                @click="emit('cell-click', getEntry(day.num, slot.start)!)"
              >
                <div class="schedule-cell-subject">{{ getEntry(day.num, slot.start)?.subjectName }}</div>
                <div class="schedule-cell-teacher">{{ getEntry(day.num, slot.start)?.teacherName }}</div>
              </div>
              <!-- Vacant -->
              <div v-else class="vacant-cell">Vacant</div>
            </td>
            <!-- Vacant teachers -->
            <td style="vertical-align: top; padding-top: 0.625rem">
              <template v-if="!isAllSpecial(slot.start)">
                <div v-if="getVacant(slot.start).length" class="flex flex-wrap gap-1">
                  <span
                    v-for="t in getVacant(slot.start)"
                    :key="t.teacherId"
                    class="badge badge-gray"
                  >{{ t.teacherName }}</span>
                </div>
                <span v-else class="text-xs" style="color: var(--color-placeholder)">None</span>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ScheduleEntry, VacantTeacher } from '~/types'

const props = defineProps<{
  entries: ScheduleEntry[]
  slotVacancies: Record<string, VacantTeacher[]>
  selectedDay?: number | null
  selectedTime?: string | null
}>()

const emit = defineEmits<{
  (e: 'cell-click', entry: ScheduleEntry): void
}>()

const DAYS = [
  { num: 1, label: 'Monday' },
  { num: 2, label: 'Tuesday' },
  { num: 3, label: 'Wednesday' },
  { num: 4, label: 'Thursday' },
  { num: 5, label: 'Friday' },
]

const timeSlots = computed(() => {
  const seen = new Map<string, { start: string; end: string }>()
  for (const e of props.entries) {
    if (!seen.has(e.slotStartTime)) seen.set(e.slotStartTime, { start: e.slotStartTime, end: e.slotEndTime })
  }
  return [...seen.values()].sort((a, b) => a.start.localeCompare(b.start))
})

function getSpecial(day: number, slotStart: string): ScheduleEntry | undefined {
  return props.entries.find(e => e.dayOfWeek === day && e.slotStartTime === slotStart && !!e.specialLabel)
}

function getEntry(day: number, slotStart: string): ScheduleEntry | undefined {
  return props.entries.find(e => e.dayOfWeek === day && e.slotStartTime === slotStart && !e.specialLabel)
}

function isAllSpecial(slotStart: string): boolean {
  return DAYS.every(d => getSpecial(d.num, slotStart) != null)
}

function specialClass(label: string) {
  if (/health|recess/i.test(label)) return 'special-health'
  if (/lunch|noon/i.test(label)) return 'special-lunch'
  if (/lac|ancillary/i.test(label)) return 'special-lac'
  if (/flag/i.test(label)) return 'special-flag'
  return ''
}

function getVacant(slotStart: string): VacantTeacher[] {
  for (const day of [1, 2, 3, 4, 5]) {
    const v = props.slotVacancies[`${day}-${slotStart}`]
    if (v) return v
  }
  return []
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const hour = h! % 12 || 12
  const suffix = h! < 12 ? 'AM' : 'PM'
  return `${hour}:${String(m ?? 0).padStart(2, '0')} ${suffix}`
}
</script>

<style scoped>
.schedule-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
  min-height: 2.5rem;
  justify-content: center;
  transition: filter 0.1s, outline 0.1s;
}

.schedule-cell--clickable {
  cursor: pointer;
}

.schedule-cell--clickable:hover {
  filter: brightness(0.93);
}

.schedule-cell--selected {
  outline: 2.5px solid currentColor;
  outline-offset: 1px;
  filter: brightness(0.88);
}

.schedule-cell-subject {
  font-weight: 700;
  font-size: 0.75rem;
  display: block;
}

.schedule-cell-teacher {
  font-size: 0.625rem;
  opacity: 0.7;
  display: block;
  margin-top: 1px;
}

.special-label-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  min-height: 2.5rem;
  text-align: center;
  background: oklch(0.9 0.04 260 / 0.3);
  color: oklch(0.35 0.1 260);
}

.special-health { background: oklch(0.92 0.06 145 / 0.35); color: oklch(0.35 0.1 145); }
.special-lunch  { background: oklch(0.93 0.06 60 / 0.35);  color: oklch(0.42 0.1 60); }
.special-lac    { background: oklch(0.91 0.04 300 / 0.3);  color: oklch(0.38 0.08 300); }
.special-flag   { background: oklch(0.9 0.06 250 / 0.3);   color: oklch(0.3 0.12 250); }

.vacant-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  min-height: 2.5rem;
  color: var(--color-muted);
  border: 1px dashed var(--color-border-strong);
}
</style>
