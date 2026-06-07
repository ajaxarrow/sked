<template>
  <div>
    <!-- Summary -->
    <div class="flex items-center justify-between mb-2">
      <p class="text-xs font-semibold uppercase tracking-wide" style="color: var(--color-muted)">
        {{ modelValue.length }} assignment{{ modelValue.length !== 1 ? 's' : '' }}
      </p>
      <button
        v-if="modelValue.length"
        class="text-xs"
        style="color: var(--color-muted); text-decoration: underline"
        @click="$emit('update:modelValue', [])"
      >
        Clear all
      </button>
    </div>

    <!-- Year level groups (collapsed by default) -->
    <div v-for="yl in yearLevels" :key="yl.id" class="mb-2">
      <button
        class="w-full flex items-center justify-between px-2 py-2 rounded-md transition-colors hover:bg-[var(--color-surface)]"
        style="border: 1px solid var(--color-border)"
        @click="toggleGrade(yl.id)"
      >
        <div class="flex items-center gap-2">
          <UIcon
            :name="openGrades.has(yl.id) ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
            class="w-3.5 h-3.5 flex-shrink-0"
            style="color: var(--color-muted)"
          />
          <span class="text-sm font-semibold" style="color: var(--color-ink)">{{ yl.name }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="countForGrade(yl.id)" class="badge badge-primary text-xs">
            {{ countForGrade(yl.id) }} assigned
          </span>
          <span v-else class="text-xs" style="color: var(--color-muted)">Click to expand</span>
        </div>
      </button>

      <div v-if="openGrades.has(yl.id)" class="rounded-b-lg overflow-hidden mt-0.5" style="border: 1px solid var(--color-border); border-top: none">
        <div
          v-for="sub in subjects"
          :key="`${sub.id}-${yl.id}`"
          class="flex items-center gap-3 px-3 py-2.5 transition-colors"
          :class="isChecked(sub.id, yl.id) ? '' : 'hover:bg-[var(--color-surface)]'"
          :style="isChecked(sub.id, yl.id) ? 'background: var(--color-primary-light)' : 'background: white'"
          style="border-bottom: 1px solid var(--color-border); cursor: pointer"
          @click="toggle(sub.id, yl.id)"
        >
          <div
            class="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors"
            :style="isChecked(sub.id, yl.id)
              ? 'background: var(--color-primary); border: 1.5px solid var(--color-primary)'
              : 'border: 1.5px solid var(--color-border-strong); background: white'"
          >
            <UIcon v-if="isChecked(sub.id, yl.id)" name="i-heroicons-check" class="w-2.5 h-2.5 text-white" />
          </div>
          <span class="text-sm flex-1" style="color: var(--color-ink)">{{ sub.name }}</span>
          <div v-if="isChecked(sub.id, yl.id)" class="flex items-center gap-1.5" @click.stop>
            <span class="text-xs" style="color: var(--color-muted)">Sections:</span>
            <input
              type="number"
              min="1"
              max="20"
              :value="getSectionCount(sub.id, yl.id)"
              class="text-xs text-center font-medium rounded"
              style="width: 3rem; padding: 0.25rem 0.375rem; border: 1px solid var(--color-border-strong); outline: none; color: var(--color-ink)"
              @focus="(e) => (e.target as HTMLInputElement).select()"
              @change="updateCount(sub.id, yl.id, ($event.target as HTMLInputElement).valueAsNumber)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Subject, YearLevel } from '~/types'

const props = defineProps<{
  subjects: Subject[]
  yearLevels: YearLevel[]
  modelValue: Array<{ subjectId: number; yearLevelId: number; sectionCount: number }>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Array<{ subjectId: number; yearLevelId: number; sectionCount: number }>]
}>()

const openGrades = ref(new Set<number>())

function toggleGrade(ylId: number) {
  const next = new Set(openGrades.value)
  if (next.has(ylId)) next.delete(ylId)
  else next.add(ylId)
  openGrades.value = next
}

function countForGrade(ylId: number) {
  return props.modelValue.filter(a => a.yearLevelId === ylId).length
}

function isChecked(subjectId: number, yearLevelId: number) {
  return props.modelValue.some(a => a.subjectId === subjectId && a.yearLevelId === yearLevelId)
}

function getSectionCount(subjectId: number, yearLevelId: number) {
  return props.modelValue.find(a => a.subjectId === subjectId && a.yearLevelId === yearLevelId)?.sectionCount ?? 1
}

function toggle(subjectId: number, yearLevelId: number) {
  if (isChecked(subjectId, yearLevelId)) {
    emit('update:modelValue', props.modelValue.filter(a => !(a.subjectId === subjectId && a.yearLevelId === yearLevelId)))
  } else {
    emit('update:modelValue', [...props.modelValue, { subjectId, yearLevelId, sectionCount: 1 }])
  }
}

function updateCount(subjectId: number, yearLevelId: number, count: number) {
  const safe = Math.max(1, Math.min(20, count || 1))
  emit('update:modelValue', props.modelValue.map(a =>
    a.subjectId === subjectId && a.yearLevelId === yearLevelId ? { ...a, sectionCount: safe } : a,
  ))
}
</script>
