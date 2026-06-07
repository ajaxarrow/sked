<template>
  <div :class="inline ? '' : 'card'">
    <div v-if="!inline" class="card-header">
      <p class="card-title">Schedule Configuration</p>
    </div>
    <div :class="inline ? 'space-y-4' : 'card-body space-y-5'">

      <!-- Class Hours -->
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide mb-3" style="color: var(--color-muted)">Class Hours</p>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label" style="font-size: 0.75rem">Start</label>
            <input v-model="local.startTime" class="form-input" type="time" />
          </div>
          <div>
            <label class="form-label" style="font-size: 0.75rem">End</label>
            <input v-model="local.endTime" class="form-input" type="time" />
          </div>
          <div>
            <label class="form-label" style="font-size: 0.75rem">Recess Start</label>
            <input v-model="local.recessStart" class="form-input" type="time" />
          </div>
          <div>
            <label class="form-label" style="font-size: 0.75rem">Recess End</label>
            <input v-model="local.recessEnd" class="form-input" type="time" />
          </div>
          <div>
            <label class="form-label" style="font-size: 0.75rem">Lunch Start</label>
            <input v-model="local.lunchStart" class="form-input" type="time" />
          </div>
          <div>
            <label class="form-label" style="font-size: 0.75rem">Lunch End</label>
            <input v-model="local.lunchEnd" class="form-input" type="time" />
          </div>
          <div class="col-span-2">
            <label class="form-label" style="font-size: 0.75rem">Slot Duration</label>
            <select v-model="local.slotDurationMinutes" class="form-input">
              <option :value="30">30 minutes</option>
              <option :value="45">45 minutes</option>
              <option :value="60">60 minutes (1 hour)</option>
              <option :value="90">90 minutes</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Flag Ceremony -->
      <div class="rounded-lg p-3 space-y-3" style="background: var(--color-surface); border: 1px solid var(--color-border)">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium" style="color: var(--color-ink)">Flag Ceremony</p>
            <p class="text-xs" style="color: var(--color-muted)">Blocks subject assignment during ceremony</p>
          </div>
          <button
            class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none"
            :style="local.flagCeremony.enabled ? 'background: var(--color-primary)' : 'background: var(--color-border-strong)'"
            @click="local.flagCeremony.enabled = !local.flagCeremony.enabled"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
              :class="local.flagCeremony.enabled ? 'translate-x-4' : 'translate-x-0.5'"
            />
          </button>
        </div>
        <template v-if="local.flagCeremony.enabled">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="form-label" style="font-size: 0.75rem">Start</label>
              <input v-model="local.flagCeremony.startTime" class="form-input" type="time" />
            </div>
            <div>
              <label class="form-label" style="font-size: 0.75rem">End</label>
              <input v-model="local.flagCeremony.endTime" class="form-input" type="time" />
            </div>
          </div>
          <div>
            <label class="form-label" style="font-size: 0.75rem">Days</label>
            <select v-model="local.flagCeremony.days" class="form-input">
              <option value="everyday">Every school day (Mon–Fri)</option>
              <option value="monday">Monday only</option>
            </select>
          </div>
        </template>
      </div>

      <!-- Consecutive subject constraint -->
      <div class="flex items-center justify-between py-1" style="border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border)">
        <div>
          <p class="text-sm font-medium" style="color: var(--color-ink)">Avoid same subject on consecutive days</p>
          <p class="text-xs" style="color: var(--color-muted)">e.g. Math at 7am Mon won't appear at 7am Tue</p>
        </div>
        <button
          class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none"
          :style="local.avoidConsecutiveSameSubject ? 'background: var(--color-primary)' : 'background: var(--color-border-strong)'"
          @click="local.avoidConsecutiveSameSubject = !local.avoidConsecutiveSameSubject"
        >
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
            :class="local.avoidConsecutiveSameSubject ? 'translate-x-4' : 'translate-x-0.5'"
          />
        </button>
      </div>

      <!-- Extra Vacant Periods -->
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide mb-2" style="color: var(--color-muted)">Extra Vacant Periods</p>
        <div
          v-for="(brk, i) in local.extraBreaks"
          :key="i"
          class="mb-2 rounded-lg p-3 space-y-2"
          style="border: 1px solid var(--color-border); background: var(--color-surface)"
        >
          <div class="flex gap-2">
            <div class="flex-1">
              <label class="form-label" style="font-size: 0.6875rem; margin-bottom: 0.25rem">Name / Label</label>
              <input
                v-model="brk.label"
                class="form-input"
                placeholder="e.g. Assembly, Ancillary"
                style="font-size: 0.8125rem; padding: 0.3rem 0.625rem"
              />
            </div>
            <div style="width: 150px" class="relative">
              <label class="form-label" style="font-size: 0.6875rem; margin-bottom: 0.25rem">Applies on</label>
              <button
                type="button"
                class="form-input w-full flex items-center justify-between gap-1 text-left"
                style="font-size: 0.8125rem; padding: 0.3rem 0.625rem; cursor: pointer"
                @click.stop="openDayPicker === i ? openDayPicker = -1 : openDayPicker = i"
              >
                <span class="truncate">{{ formatDays(brk.days) }}</span>
                <UIcon name="i-heroicons-chevron-down" class="w-3 h-3 flex-shrink-0" style="color: var(--color-muted)" />
              </button>
              <div
                v-if="openDayPicker === i"
                class="absolute z-50 mt-1 rounded-lg shadow-lg"
                style="border: 1px solid var(--color-border); background: white; min-width: 150px; top: 100%; left: 0"
                @click.stop
              >
                <!-- All -->
                <label class="flex items-center gap-2 px-3 py-2 cursor-pointer transition hover:bg-[var(--color-surface)]" style="border-bottom: 1px solid var(--color-border)">
                  <input
                    type="checkbox"
                    :checked="brk.days.length === 5"
                    style="accent-color: var(--color-primary); width: 0.875rem; height: 0.875rem"
                    @change="brk.days = brk.days.length === 5 ? [] : [1,2,3,4,5]"
                  />
                  <span class="text-sm font-semibold" style="color: var(--color-ink)">All days</span>
                </label>
                <!-- Mon–Fri -->
                <label
                  v-for="day in WEEK_DAYS"
                  :key="day.num"
                  class="flex items-center gap-2 px-3 py-2 cursor-pointer transition hover:bg-[var(--color-surface)]"
                >
                  <input
                    type="checkbox"
                    :value="day.num"
                    :checked="brk.days.includes(day.num)"
                    style="accent-color: var(--color-primary); width: 0.875rem; height: 0.875rem"
                    @change="toggleDay(brk, day.num)"
                  />
                  <span class="text-sm" style="color: var(--color-ink)">{{ day.label }}</span>
                </label>
              </div>
            </div>
            <button class="self-end pb-1" style="color: var(--color-danger)" @click="local.extraBreaks.splice(i, 1)">
              <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
            </button>
          </div>
          <div class="flex items-center gap-2">
            <div>
              <label class="form-label" style="font-size: 0.6875rem; margin-bottom: 0.25rem">From</label>
              <input v-model="brk.startTime" class="form-input w-28" type="time" style="font-size: 0.8125rem; padding: 0.3rem 0.5rem" />
            </div>
            <span class="mt-4" style="color: var(--color-muted)">–</span>
            <div>
              <label class="form-label" style="font-size: 0.6875rem; margin-bottom: 0.25rem">To</label>
              <input v-model="brk.endTime" class="form-input w-28" type="time" style="font-size: 0.8125rem; padding: 0.3rem 0.5rem" />
            </div>
          </div>
        </div>
        <button
          class="btn-ghost w-full justify-center"
          style="font-size: 0.8125rem; padding: 0.375rem"
          @click="local.extraBreaks.push({ label: '', startTime: '11:30', endTime: '12:00', days: [1,2,3,4,5] })"
        >
          <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
          Add Vacant Period
        </button>
      </div>

      <button
        class="btn-primary w-full justify-center"
        :disabled="loading"
        @click="$emit('generate', deepCopy(local))"
      >
        <UIcon v-if="loading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
        <UIcon v-else name="i-heroicons-sparkles" class="w-4 h-4" />
        {{ loading ? 'Generating...' : 'Generate Schedule' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ loading?: boolean; inline?: boolean; initialConfig?: any }>()
defineEmits<{ generate: [config: any] }>()

function deepCopy<T>(v: T): T { return JSON.parse(JSON.stringify(v)) }

const WEEK_DAYS = [
  { num: 1, label: 'Monday' },
  { num: 2, label: 'Tuesday' },
  { num: 3, label: 'Wednesday' },
  { num: 4, label: 'Thursday' },
  { num: 5, label: 'Friday' },
]
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

function formatDays(days: number[]) {
  if (!days.length) return 'No days'
  if (days.length === 5) return 'Every day'
  return days.map(d => DAY_SHORT[d - 1]).join(', ')
}

function toggleDay(brk: { days: number[] }, num: number) {
  if (brk.days.includes(num)) brk.days = brk.days.filter(d => d !== num)
  else brk.days = [...brk.days, num].sort()
}

const openDayPicker = ref(-1)

if (typeof window !== 'undefined') {
  window.addEventListener('click', () => { openDayPicker.value = -1 }, { passive: true })
}

const local = reactive({
  startTime: '07:00',
  endTime: '17:00',
  recessStart: '09:00',
  recessEnd: '09:30',
  lunchStart: '12:00',
  lunchEnd: '13:00',
  slotDurationMinutes: 60,
  avoidConsecutiveSameSubject: true,
  flagCeremony: {
    enabled: false,
    startTime: '07:00',
    endTime: '07:30',
    days: 'monday' as 'everyday' | 'monday',
  },
  extraBreaks: [] as Array<{ label: string; startTime: string; endTime: string; days: number[] }>,
})

watch(() => props.initialConfig, (cfg) => {
  if (!cfg) return
  if (cfg.startTime !== undefined) local.startTime = cfg.startTime
  if (cfg.endTime !== undefined) local.endTime = cfg.endTime
  if (cfg.recessStart !== undefined) local.recessStart = cfg.recessStart
  if (cfg.recessEnd !== undefined) local.recessEnd = cfg.recessEnd
  if (cfg.lunchStart !== undefined) local.lunchStart = cfg.lunchStart
  if (cfg.lunchEnd !== undefined) local.lunchEnd = cfg.lunchEnd
  if (cfg.slotDurationMinutes !== undefined) local.slotDurationMinutes = cfg.slotDurationMinutes
  if (cfg.avoidConsecutiveSameSubject !== undefined) local.avoidConsecutiveSameSubject = cfg.avoidConsecutiveSameSubject
  if (cfg.flagCeremony) {
    if (cfg.flagCeremony.enabled !== undefined) local.flagCeremony.enabled = cfg.flagCeremony.enabled
    if (cfg.flagCeremony.startTime !== undefined) local.flagCeremony.startTime = cfg.flagCeremony.startTime
    if (cfg.flagCeremony.endTime !== undefined) local.flagCeremony.endTime = cfg.flagCeremony.endTime
    if (cfg.flagCeremony.days !== undefined) local.flagCeremony.days = cfg.flagCeremony.days
  }
  if (cfg.extraBreaks !== undefined) local.extraBreaks = deepCopy(cfg.extraBreaks)
}, { immediate: true })
</script>
