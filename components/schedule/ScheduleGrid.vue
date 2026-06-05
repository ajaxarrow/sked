<template>
  <div class="overflow-x-auto rounded-lg border">
    <table class="w-full text-sm border-collapse">
      <thead>
        <tr class="bg-gray-50">
          <th class="border-b border-r p-3 text-left text-xs font-semibold text-gray-500 w-24">Time</th>
          <th
            v-for="day in DAYS"
            :key="day.num"
            class="border-b border-r p-3 text-center text-xs font-semibold text-gray-500 min-w-36"
          >
            {{ day.label }}
          </th>
          <th class="border-b p-3 text-left text-xs font-semibold text-gray-500 min-w-44">
            Vacant Teachers
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="slot in timeSlots" :key="slot.start" class="hover:bg-gray-50/50">
          <td class="border-b border-r p-2 text-xs text-gray-500 whitespace-nowrap align-middle">
            <span class="font-medium">{{ slot.start }}</span>
            <span class="text-gray-300 mx-1">–</span>
            <span>{{ slot.end }}</span>
          </td>
          <td
            v-for="day in DAYS"
            :key="day.num"
            class="border-b border-r p-1.5 text-center align-middle"
          >
            <div
              v-if="getEntry(day.num, slot.start)"
              class="rounded-md px-2 py-1.5 text-white text-xs font-medium shadow-sm"
              :style="{ backgroundColor: getEntry(day.num, slot.start)?.subjectColor }"
            >
              <p class="font-semibold">{{ getEntry(day.num, slot.start)?.subjectName }}</p>
              <p class="opacity-80 mt-0.5">{{ getEntry(day.num, slot.start)?.teacherName }}</p>
            </div>
            <span v-else class="text-gray-200 text-xs">—</span>
          </td>
          <td class="border-b p-2 align-top">
            <div v-if="getVacant(slot.start).length" class="space-y-0.5">
              <div
                v-for="t in getVacant(slot.start)"
                :key="t.teacherId"
                class="text-xs text-gray-500 bg-gray-100 rounded px-1.5 py-0.5 inline-block mr-1 mb-0.5"
              >
                {{ t.teacherName }}
              </div>
            </div>
            <span v-else class="text-xs text-gray-300">None</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { ScheduleEntry, VacantTeacher } from '~/types'

const props = defineProps<{
  entries: ScheduleEntry[]
  slotVacancies: Record<string, VacantTeacher[]>
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
    if (!seen.has(e.slotStartTime)) {
      seen.set(e.slotStartTime, { start: e.slotStartTime, end: e.slotEndTime })
    }
  }
  return [...seen.values()].sort((a, b) => a.start.localeCompare(b.start))
})

function getEntry(day: number, slotStart: string): ScheduleEntry | undefined {
  return props.entries.find(e => e.dayOfWeek === day && e.slotStartTime === slotStart)
}

function getVacant(slotStart: string): VacantTeacher[] {
  for (const day of [1, 2, 3, 4, 5]) {
    const v = props.slotVacancies[`${day}-${slotStart}`]
    if (v) return v
  }
  return []
}
</script>
