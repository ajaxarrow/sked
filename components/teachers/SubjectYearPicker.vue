<template>
  <div class="border rounded-lg overflow-hidden">
    <div class="bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500 border-b">
      {{ selected.length }} selected
    </div>
    <div class="max-h-64 overflow-y-auto divide-y">
      <label
        v-for="option in options"
        :key="option.value"
        class="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 transition"
      >
        <input
          type="checkbox"
          :value="option.value"
          v-model="selected"
          class="rounded text-primary-600"
        />
        <span class="text-sm">{{ option.label }}</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Subject, YearLevel } from '~/types'

const props = defineProps<{
  subjects: Subject[]
  yearLevels: YearLevel[]
  modelValue: Array<{ subjectId: number; yearLevelId: number }>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Array<{ subjectId: number; yearLevelId: number }>]
}>()

const options = computed(() =>
  props.yearLevels.flatMap(yl =>
    props.subjects.map(sub => ({
      label: `${sub.name} — ${yl.name}`,
      value: `${sub.id}-${yl.id}`,
    })),
  ),
)

const selected = computed({
  get: () => props.modelValue.map(a => `${a.subjectId}-${a.yearLevelId}`),
  set: (vals: string[]) =>
    emit(
      'update:modelValue',
      vals.map(v => {
        const [subjectId, yearLevelId] = v.split('-').map(Number)
        return { subjectId: subjectId!, yearLevelId: yearLevelId! }
      }),
    ),
})
</script>
