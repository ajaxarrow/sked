<template>
  <div>
    <!-- Hours summary -->
    <div class="summary-bar">
      <div class="summary-week">
        <span class="summary-label">Teaching hrs / week</span>
        <div class="summary-value-row">
          <span class="summary-value" :class="{ exceeded: hoursPerWeek > teacher.maxHoursPerWeek }">
            {{ hoursPerWeek % 1 === 0 ? hoursPerWeek : hoursPerWeek.toFixed(1) }}
          </span>
          <span class="summary-max">/ {{ teacher.maxHoursPerWeek }} max</span>
        </div>
        <div class="summary-bar-track">
          <div
            class="summary-bar-fill"
            :class="hoursPerWeek > teacher.maxHoursPerWeek ? 'exceeded' : ''"
            :style="{ width: Math.min(100, (hoursPerWeek / teacher.maxHoursPerWeek) * 100) + '%' }"
          />
        </div>
      </div>
      <div class="summary-days">
        <div v-for="day in DAYS" :key="day.num" class="summary-day">
          <span class="summary-day-label">{{ day.short }}</span>
          <span
            class="summary-day-hours"
            :class="{ exceeded: (hoursPerDay[day.num] ?? 0) > teacher.maxHoursPerDay }"
          >
            {{ (hoursPerDay[day.num] ?? 0) % 1 === 0 ? (hoursPerDay[day.num] ?? 0) : (hoursPerDay[day.num] ?? 0).toFixed(1) }}h
          </span>
          <span class="summary-day-max">/ {{ teacher.maxHoursPerDay }}</span>
        </div>
      </div>
      <div v-if="assignedSubjects.length" class="summary-subjects">
        <span class="summary-label">Assigned subjects</span>
        <div class="subject-tags">
          <span v-for="item in assignedSubjects" :key="item.subjectName + '-' + item.sectionName" class="subject-tag">
            {{ item.subjectName }} <span class="subject-tag-meta">• {{ item.sectionName }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Schedule grid -->
    <div class="tg-wrapper">
      <div class="tg-scroll">
        <table class="tg">
          <thead>
            <tr>
              <th class="tg-time">Time</th>
              <th v-for="day in DAYS" :key="day.num" class="tg-day-head">{{ day.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="slot in allSlotTimes" :key="slot.slotStartTime">
              <td class="tg-time tg-time-cell">
                <span class="tg-time-start">{{ formatSlotLabel(slot.slotStartTime) }}</span>
                <span class="tg-time-sep">–</span>
                <span class="tg-time-end">{{ formatSlotLabel(slot.slotEndTime) }}</span>
              </td>
              <td v-for="day in DAYS" :key="day.num" class="tg-slot-cell">
                <!-- Teaching assignment -->
                <div
                  v-if="getTeaching(day.num, slot.slotStartTime)"
                  class="tg-teaching-chip tg-teaching-chip--clickable"
                  :class="{ 'tg-teaching-chip--selected': props.selectedDay === day.num && props.selectedTime === slot.slotStartTime && props.selectedSection === getTeaching(day.num, slot.slotStartTime)!.sectionId }"
                  :style="{ background: subjectBg(getTeaching(day.num, slot.slotStartTime)!), color: subjectFg(getTeaching(day.num, slot.slotStartTime)!) }"
                  title="Click to find conflict-free swap options"
                  @click="emit('cell-click', getTeaching(day.num, slot.slotStartTime)!)"
                >
                  <span class="tg-subject">{{ getTeaching(day.num, slot.slotStartTime)!.subjectName }}</span>
                  <span class="tg-section">{{ getTeaching(day.num, slot.slotStartTime)!.sectionName }}</span>
                </div>
                <!-- Special / break -->
                <div
                  v-else-if="getSpecial(day.num, slot.slotStartTime)"
                  class="tg-special-chip"
                  :class="specialClass(getSpecial(day.num, slot.slotStartTime)!.specialLabel!)"
                >
                  {{ getSpecial(day.num, slot.slotStartTime)!.specialLabel }}
                </div>
                <!-- Vacant -->
                <div v-else class="tg-vacant-chip">Vacant</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Teacher {
  id: string
  name: string
  maxHoursPerWeek: number
  maxHoursPerDay: number
}

interface TeachingEntry {
  sectionId: string | null
  dayOfWeek: number
  slotStartTime: string
  slotEndTime: string
  subjectName: string | null
  subjectColor: string | null
  sectionName: string | null
  sectionYearLevel: string | null
}

interface SpecialSlot {
  dayOfWeek: number
  slotStartTime: string
  slotEndTime: string
  specialLabel: string | null
}

interface SlotTime {
  slotStartTime: string
  slotEndTime: string
}

const props = defineProps<{
  teacher: Teacher
  teachingEntries: TeachingEntry[]
  specialSlots: SpecialSlot[]
  allSlotTimes: SlotTime[]
  selectedDay?: number | null
  selectedTime?: string | null
  selectedSection?: string | null
  colorBy?: 'subject' | 'teacher'
}>()

const emit = defineEmits<{
  (e: 'cell-click', entry: TeachingEntry): void
}>()

const DAYS = [
  { num: 1, label: 'Monday',    short: 'Mon' },
  { num: 2, label: 'Tuesday',   short: 'Tue' },
  { num: 3, label: 'Wednesday', short: 'Wed' },
  { num: 4, label: 'Thursday',  short: 'Thu' },
  { num: 5, label: 'Friday',    short: 'Fri' },
]

const teachingMap = computed(() => {
  const map = new Map<string, TeachingEntry>()
  for (const e of props.teachingEntries) {
    map.set(`${e.dayOfWeek}-${e.slotStartTime}`, e)
  }
  return map
})

const specialMap = computed(() => {
  const map = new Map<string, SpecialSlot>()
  for (const s of props.specialSlots) {
    map.set(`${s.dayOfWeek}-${s.slotStartTime}`, s)
  }
  return map
})

function getTeaching(day: number, start: string): TeachingEntry | undefined {
  return teachingMap.value.get(`${day}-${start}`)
}

function getSpecial(day: number, start: string): SpecialSlot | undefined {
  return specialMap.value.get(`${day}-${start}`)
}

function slotMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh! * 60 + em!) - (sh! * 60 + sm!)
}

const hoursPerWeek = computed(() =>
  props.teachingEntries.reduce((sum, e) => sum + slotMinutes(e.slotStartTime, e.slotEndTime), 0) / 60
)

const hoursPerDay = computed(() => {
  const r: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const e of props.teachingEntries) {
    r[e.dayOfWeek] = (r[e.dayOfWeek] ?? 0) + slotMinutes(e.slotStartTime, e.slotEndTime) / 60
  }
  return r
})

function formatSlotLabel(t: string) {
  const [h, m] = t.split(':').map(Number)
  const hour = h! % 12 || 12
  const suffix = h! < 12 ? 'AM' : 'PM'
  return `${hour}:${String(m ?? 0).padStart(2, '0')} ${suffix}`
}

const assignedSubjects = computed(() => {
  const items = props.teachingEntries
    .filter((entry) => entry.subjectName)
    .map((entry) => ({
      subjectName: entry.subjectName!,
      sectionName: entry.sectionName || 'Section',
    }))

  return [...new Map(items.map((item) => [item.subjectName + '|' + item.sectionName, item])).values()]
})

function cellColor(_entry: TeachingEntry): string {
  if (props.colorBy === 'teacher') return props.teacher.colorHex ?? '#6366f1'
  return _entry.subjectColor ?? '#6366f1'
}

function subjectBg(entry: TeachingEntry) {
  return cellColor(entry) + '22'
}

function subjectFg(entry: TeachingEntry) {
  return cellColor(entry)
}

function specialClass(label: string) {
  if (/health|recess/i.test(label)) return 'tg-health'
  if (/lunch|noon/i.test(label)) return 'tg-lunch'
  if (/lac|ancillary/i.test(label)) return 'tg-lac'
  return ''
}
</script>

<style scoped>
/* Summary bar */
.summary-bar {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
  border-radius: 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  flex-wrap: wrap;
}

.summary-week {
  min-width: 160px;
}

.summary-label {
  display: block;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
  margin-bottom: 0.25rem;
}

.summary-value-row {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-ink);
  line-height: 1;
}

.summary-value.exceeded {
  color: oklch(0.5 0.18 20);
}

.summary-max {
  font-size: 0.8125rem;
  color: var(--color-muted);
}

.summary-bar-track {
  margin-top: 0.5rem;
  height: 4px;
  border-radius: 2px;
  background: var(--color-border);
  overflow: hidden;
}

.summary-bar-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.summary-bar-fill.exceeded {
  background: oklch(0.5 0.18 20);
}

.summary-days {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  flex: 1;
}

.summary-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 48px;
}

.summary-day-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
  margin-bottom: 0.25rem;
}

.summary-day-hours {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-ink);
  line-height: 1;
}

.summary-day-hours.exceeded {
  color: oklch(0.5 0.18 20);
}

.summary-day-max {
  font-size: 0.625rem;
  color: var(--color-muted);
  margin-top: 0.125rem;
}

.summary-subjects {
  min-width: 220px;
  flex: 1;
}

.subject-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.subject-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 999px;
  background: var(--color-surface-strong, var(--color-surface));
  border: 1px solid var(--color-border);
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: var(--color-ink);
}

.subject-tag-meta {
  color: var(--color-muted);
  font-size: 0.6875rem;
}

/* Grid */
.tg-wrapper {
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  overflow: hidden;
  background: white;
}

.tg-scroll {
  overflow-x: auto;
  max-height: calc(100vh - 320px);
}

.tg {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
}

.tg thead {
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--color-surface);
  border-bottom: 2px solid var(--color-border);
}

.tg thead th {
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-muted);
  text-align: center;
}

.tg-time {
  width: 100px;
  min-width: 100px;
  background: var(--color-surface);
  position: sticky;
  left: 0;
  z-index: 3;
  border-right: 1px solid var(--color-border);
  text-align: center;
}

.tg-day-head {
  min-width: 140px;
}

.tg-time-cell {
  padding: 0.375rem 0.5rem;
  vertical-align: middle;
}

.tg-time-start, .tg-time-end {
  display: block;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-ink);
  line-height: 1.2;
  text-align: center;
}

.tg-time-sep {
  display: block;
  font-size: 0.5625rem;
  color: var(--color-muted);
  text-align: center;
  line-height: 1;
}

.tg tbody tr {
  border-top: 1px solid var(--color-border);
}

.tg-slot-cell {
  padding: 0.25rem 0.375rem;
  vertical-align: middle;
  text-align: center;
}

.tg-teaching-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
  min-height: 2.5rem;
  justify-content: center;
  line-height: 1.25;
  transition: filter 0.1s;
}
.tg-teaching-chip--clickable {
  cursor: pointer;
}
.tg-teaching-chip--clickable:hover {
  filter: brightness(0.93);
}
.tg-teaching-chip--selected {
  outline: 2.5px solid currentColor;
  outline-offset: 1px;
  filter: brightness(0.88);
}

.tg-subject {
  font-weight: 700;
  font-size: 0.75rem;
  display: block;
}

.tg-section {
  font-size: 0.625rem;
  opacity: 0.7;
  display: block;
  margin-top: 1px;
}

.tg-special-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.625rem;
  font-weight: 600;
  min-height: 2.5rem;
  background: oklch(0.9 0.04 260 / 0.3);
  color: oklch(0.35 0.1 260);
}

.tg-health {
  background: oklch(0.92 0.06 145 / 0.35);
  color: oklch(0.35 0.1 145);
}

.tg-lunch {
  background: oklch(0.93 0.06 60 / 0.35);
  color: oklch(0.42 0.1 60);
}

.tg-lac {
  background: oklch(0.91 0.04 300 / 0.3);
  color: oklch(0.38 0.08 300);
}

.tg-vacant-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.625rem;
  font-weight: 600;
  min-height: 2.5rem;
  color: var(--color-muted);
  border: 1px dashed var(--color-border-strong);
  background: transparent;
}
</style>
