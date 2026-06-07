<template>
  <div class="master-grid-wrapper">
    <div class="master-grid-scroll">
      <table class="master-grid">
        <thead>
          <tr>
            <th class="col-time">Time</th>
            <th class="col-day">Day</th>
            <th v-for="sec in sections" :key="sec.id" class="col-section" :title="`${sec.yearLevelName} – ${sec.name}`">
              <div class="section-header-name">{{ sec.name }}</div>
              <div class="section-header-level">{{ sec.yearLevelName }}</div>
            </th>
            <th class="col-vac">Vacant Teachers</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(slot, si) in slots" :key="slot.key">
            <!-- Uniform all-day special (Health Break, Lunch, etc.) — single compact row -->
            <tr v-if="uniformLabels.get(slot.start)" class="slot-first-row slot-last-row uniform-row">
              <td class="col-time time-cell">
                <span class="time-label">{{ formatTime(slot.start) }}</span>
                <span class="time-sep">–</span>
                <span class="time-label">{{ formatTime(slot.end) }}</span>
              </td>
              <td class="col-day day-cell uniform-day">M–F</td>
              <td
                v-for="sec in sections"
                :key="`${slot.key}-unif-${sec.id}`"
                class="col-section entry-cell"
              >
                <div class="special-chip" :class="specialClass(uniformLabels.get(slot.start)!)">
                  {{ uniformLabels.get(slot.start) }}
                </div>
              </td>
              <td class="col-vac"></td>
            </tr>

            <!-- Normal slot — one row per day -->
            <template v-else>
              <tr v-for="(day, di) in DAYS" :key="`${slot.key}-${day.num}`"
                :class="{ 'slot-first-row': di === 0, 'slot-last-row': di === DAYS.length - 1 }"
              >
                <!-- Time cell — only on first day row of each slot -->
                <td v-if="di === 0" :rowspan="DAYS.length" class="col-time time-cell">
                  <span class="time-label">{{ formatTime(slot.start) }}</span>
                  <span class="time-sep">–</span>
                  <span class="time-label">{{ formatTime(slot.end) }}</span>
                </td>

                <!-- Day label -->
                <td class="col-day day-cell" :class="{ 'mon-row': day.num === 1 }">{{ day.label }}</td>

                <!-- Section cells -->
                <td
                  v-for="sec in sections"
                  :key="`${slot.key}-${day.num}-${sec.id}`"
                  class="col-section entry-cell"
                >
                  <template v-if="getEntry(sec.id, day.num, slot.start) as any">
                    <div
                      v-if="(getEntry(sec.id, day.num, slot.start) as any)?.specialLabel"
                      class="special-chip"
                      :class="specialClass((getEntry(sec.id, day.num, slot.start) as any).specialLabel)"
                    >
                      {{ (getEntry(sec.id, day.num, slot.start) as any).specialLabel }}
                    </div>
                    <template v-else>
                      <div
                        class="subject-chip subject-chip--clickable"
                        :class="{ 'subject-chip--selected': props.selectedDay === day.num && props.selectedTime === slot.start && props.selectedSection === sec.id }"
                        :style="{ background: subjectBg((getEntry(sec.id, day.num, slot.start) as any)?.subjectColor), color: subjectFg((getEntry(sec.id, day.num, slot.start) as any)?.subjectColor) }"
                        title="Click to find conflict-free swap options"
                        @click="emit('cell-click', getEntry(sec.id, day.num, slot.start)!)"
                      >
                        <span class="subject-name">{{ (getEntry(sec.id, day.num, slot.start) as any)?.subjectName }}</span>
                        <span class="teacher-name">{{ shortName((getEntry(sec.id, day.num, slot.start) as any)?.teacherName) }}</span>
                      </div>
                    </template>
                  </template>
                </td>

                <!-- Vacant teachers cell -->
                <td class="col-vac" style="vertical-align: top; padding-top: 0.375rem">
                  <div v-if="vacantMap.get(`${slot.start}|${day.num}`)?.length" class="vac-list">
                    <span
                      v-for="name in vacantMap.get(`${slot.start}|${day.num}`)"
                      :key="name"
                      class="vac-badge"
                    >{{ name }}</span>
                  </div>
                  <span v-else class="vac-none">&mdash;</span>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ScheduleEntry, Section } from '~/types'

interface SectionWithLevel extends Section {
  yearLevelName?: string
  sortOrder?: number
}

const props = defineProps<{
  sections: SectionWithLevel[]
  entries: ScheduleEntry[]
  selectedDay?: number | null
  selectedTime?: string | null
  selectedSection?: string | null
}>()

const emit = defineEmits<{
  (e: 'cell-click', entry: ScheduleEntry): void
}>()

const DAYS = [
  { num: 1, label: 'M' },
  { num: 2, label: 'T' },
  { num: 3, label: 'W' },
  { num: 4, label: 'Th' },
  { num: 5, label: 'F' },
]

// Derive unique time slots sorted by start time
const slots = computed(() => {
  const seen = new Map<string, { start: string; end: string; key: string }>()
  for (const e of props.entries) {
    const key = e.slotStartTime
    if (!seen.has(key)) {
      seen.set(key, { start: e.slotStartTime, end: e.slotEndTime, key })
    }
  }
  return [...seen.values()].sort((a, b) => a.start.localeCompare(b.start))
})

// Fast lookup: "sectionId|day|start" → entry
const entryMap = computed(() => {
  const map = new Map<string, ScheduleEntry>()
  for (const e of props.entries) {
    map.set(`${e.sectionId}|${e.dayOfWeek}|${e.slotStartTime}`, e)
  }
  return map
})

function getEntry(sectionId: string, day: number, start: string): ScheduleEntry | undefined {
  return entryMap.value.get(`${sectionId}|${day}|${start}`)
}

// For each slot, if every section × every day has the same specialLabel (and nothing else),
// returns that label — enabling a single merged row instead of 5 identical ones.
const uniformLabels = computed(() => {
  const map = new Map<string, string | null>()
  if (!props.sections.length) return map
  for (const slot of slots.value) {
    let label: string | null = null
    let uniform = true
    outer: for (const day of [1, 2, 3, 4, 5]) {
      for (const sec of props.sections) {
        const e = getEntry(sec.id, day, slot.start)
        if (!e || !e.specialLabel) { uniform = false; break outer }
        if (!label) label = e.specialLabel
        else if (e.specialLabel !== label) { uniform = false; break outer }
      }
    }
    map.set(slot.start, uniform && label ? label : null)
  }
  return map
})

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h! < 12 ? 'AM' : 'PM'
  const hh = h! % 12 || 12
  return m === 0 ? `${hh}${ampm}` : `${hh}:${String(m).padStart(2,'0')}${ampm}`
}

function shortName(name?: string | null) {
  if (!name) return ''
  // Return last name (first word before any comma, or last space-separated word)
  if (name.includes(',')) return name.split(',')[0]!.trim()
  const parts = name.trim().split(' ')
  return parts[parts.length - 1] ?? name
}

function hexToOklch(hex: string) {
  // Simple hex → RGB → rough lightness check
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function specialClass(label: string) {
  if (/health|recess/i.test(label)) return 'special-health'
  if (/lunch|noon break/i.test(label)) return 'special-lunch'
  if (/lac|ancillary/i.test(label)) return 'special-lac'
  return '' // default blue for flag ceremony, programs, etc.
}

function subjectBg(hex?: string | null) {
  if (!hex) return 'var(--color-surface)'
  return hex + '22'
}

function subjectFg(hex?: string | null) {
  if (!hex) return 'var(--color-ink)'
  return hex
}

// ── Vacant teachers ────────────────────────────────────────────────────────

const allTeachers = computed(() => {
  const map = new Map<string, string>()
  for (const e of props.entries) {
    if (e.teacherId && e.teacherName && !e.specialLabel) map.set(e.teacherId, e.teacherName)
  }
  return map
})

// Pre-compute `slotStart|day` → sorted list of vacant teacher short-names
const vacantMap = computed(() => {
  const result = new Map<string, string[]>()
  for (const slot of slots.value) {
    if (uniformLabels.value.get(slot.start)) continue
    for (const day of [1, 2, 3, 4, 5]) {
      const busy = new Set<string>()
      for (const e of props.entries) {
        if (e.slotStartTime === slot.start && e.dayOfWeek === day && e.teacherId && !e.specialLabel) {
          busy.add(e.teacherId)
        }
      }
      const names = [...allTeachers.value.entries()]
        .filter(([id]) => !busy.has(id))
        .map(([, name]) => shortName(name))
        .sort()
      result.set(`${slot.start}|${day}`, names)
    }
  }
  return result
})
</script>

<style scoped>
.master-grid-wrapper {
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  overflow: hidden;
  background: white;
}

.master-grid-scroll {
  overflow-x: auto;
  overflow-y: auto;
  max-height: calc(100vh - 220px);
}

.master-grid {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
  table-layout: fixed;
}

.master-grid thead {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-surface, #f8f7f5);
}

.master-grid thead tr {
  border-bottom: 2px solid var(--color-border);
}

.col-time {
  width: 80px;
  min-width: 80px;
  text-align: center;
  background: var(--color-surface, #f8f7f5);
  position: sticky;
  left: 0;
  z-index: 11;
  border-right: 1px solid var(--color-border);
}

.col-day {
  width: 32px;
  min-width: 32px;
  text-align: center;
  background: var(--color-surface, #f8f7f5);
  position: sticky;
  left: 80px;
  z-index: 10;
  border-right: 1px solid var(--color-border);
  font-weight: 600;
  color: var(--color-muted);
}

.col-section {
  min-width: 110px;
  max-width: 130px;
  text-align: center;
}

.section-header-name {
  font-weight: 700;
  font-size: 0.6875rem;
  color: var(--color-ink);
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.section-header-level {
  font-size: 0.625rem;
  color: var(--color-muted);
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

thead th {
  padding: 0.5rem 0.375rem;
  font-weight: 600;
  font-size: 0.6875rem;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
}

tbody td {
  padding: 0.25rem 0.25rem;
  vertical-align: middle;
  border-bottom: 1px solid var(--color-border-light, #f0ede8);
}

.slot-first-row td {
  border-top: 1px solid var(--color-border);
}

.time-cell {
  padding: 0.375rem 0.25rem;
  text-align: center;
  vertical-align: middle;
}

.time-label {
  display: block;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-ink);
  line-height: 1.2;
}

.time-sep {
  display: block;
  font-size: 0.5625rem;
  color: var(--color-muted);
  line-height: 1;
}

.day-cell {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-muted);
}

.mon-row {
  color: var(--color-primary, oklch(0.35 0.12 15));
}

.entry-cell {
  padding: 0.1875rem 0.25rem;
}

.subject-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.25rem 0.25rem;
  border-radius: 0.3125rem;
  line-height: 1.2;
  min-height: 2.25rem;
  justify-content: center;
  transition: filter 0.1s;
}
.subject-chip--clickable { cursor: pointer; }
.subject-chip--clickable:hover { filter: brightness(0.93); }
.subject-chip--selected {
  outline: 2px solid currentColor;
  outline-offset: 1px;
  filter: brightness(0.88);
}

.subject-name {
  font-weight: 700;
  font-size: 0.6875rem;
  display: block;
  text-align: center;
}

.teacher-name {
  font-size: 0.5625rem;
  opacity: 0.75;
  display: block;
  text-align: center;
  margin-top: 1px;
}

.uniform-row .time-cell {
  padding: 0.25rem;
}

.uniform-day {
  font-size: 0.5625rem;
  font-weight: 700;
  color: var(--color-muted);
  letter-spacing: 0.02em;
}

.uniform-row .entry-cell {
  padding: 0.125rem 0.25rem;
}

.uniform-row .special-chip {
  min-height: 1.625rem;
  padding: 0.125rem 0.25rem;
  font-size: 0.5625rem;
}

.special-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0.25rem;
  border-radius: 0.3125rem;
  font-size: 0.5625rem;
  font-weight: 600;
  background: oklch(0.9 0.04 260 / 0.3);
  color: oklch(0.35 0.1 260);
  min-height: 2.25rem;
  line-height: 1.3;
}

.special-health {
  background: oklch(0.92 0.06 145 / 0.35);
  color: oklch(0.35 0.1 145);
}

.special-lunch {
  background: oklch(0.93 0.06 60 / 0.35);
  color: oklch(0.42 0.1 60);
}

.special-lac {
  background: oklch(0.91 0.04 300 / 0.3);
  color: oklch(0.38 0.08 300);
}

.col-vac {
  min-width: 120px;
  max-width: 160px;
  text-align: left;
  padding: 0.25rem 0.5rem;
  vertical-align: middle;
  background: var(--color-surface, #f8f7f5);
  border-left: 1px solid var(--color-border);
}

thead .col-vac {
  position: sticky;
  right: 0;
  z-index: 10;
}

.vac-list {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.vac-badge {
  display: inline-block;
  background: var(--color-border-light, #ede9e3);
  color: var(--color-muted);
  font-size: 0.5625rem;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 4px;
  white-space: nowrap;
}

.vac-none {
  color: var(--color-border-strong, #c8c0b4);
  font-size: 0.6875rem;
}
</style>
