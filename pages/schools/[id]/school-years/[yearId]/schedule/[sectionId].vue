<template>
  <UContainer class="py-10 max-w-screen-2xl">
    <div class="flex items-center gap-3 mb-6">
      <UButton :to="`/schools/${schoolId}/school-years/${yearId}/sections`" variant="ghost" icon="i-heroicons-arrow-left" size="sm" />
      <div class="flex-1">
        <h1 class="text-xl font-bold">
          Schedule — {{ section?.name }}
          <UBadge v-if="section?.yearLevelName" color="blue" variant="subtle" size="sm" class="ml-2">
            {{ section?.yearLevelName }}
          </UBadge>
        </h1>
        <p v-if="generated !== null" class="text-sm text-gray-500 mt-0.5">
          {{ generated }} schedule slots generated
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6 items-start">
      <div class="xl:sticky xl:top-4">
        <GenerateParamsForm :loading="generating" @generate="generate" />
      </div>

      <div>
        <div v-if="!schedule?.entries?.length" class="flex flex-col items-center justify-center py-24 text-gray-400 border rounded-lg bg-white">
          <UIcon name="i-heroicons-calendar" class="w-12 h-12 mb-3 text-gray-200" />
          <p class="text-base font-medium text-gray-500">No schedule yet</p>
          <p class="text-sm mt-1">Configure the settings and click Generate Schedule.</p>
        </div>
        <ScheduleGrid v-else :entries="schedule.entries" :slot-vacancies="schedule.slotVacancies" />
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import type { Section } from '~/types'
const route = useRoute()
const schoolId = parseInt(route.params.id as string)
const yearId = parseInt(route.params.yearId as string)
const sectionId = parseInt(route.params.sectionId as string)

const { data: section } = await useFetch<Section>(`/api/sections/${sectionId}`)
const { data: schedule, refresh } = await useFetch<{ entries: any[]; slotVacancies: any }>(
  `/api/schedules/${sectionId}`,
  { default: () => ({ entries: [], slotVacancies: {} }) },
)

const generating = ref(false)
const generated = ref<number | null>(null)

async function generate(config: any) {
  generating.value = true
  try {
    const result = await $fetch<{ generated: number }>('/api/schedules/generate', {
      method: 'POST',
      body: { sectionIds: [sectionId], config },
    })
    generated.value = result.generated
    await refresh()
  } finally {
    generating.value = false
  }
}
</script>
