<template>
  <UContainer class="py-10">
    <div v-if="school">
      <div class="flex justify-between items-start mb-8">
        <div>
          <div class="flex items-center gap-3">
            <UButton to="/" variant="ghost" icon="i-heroicons-arrow-left" size="sm" />
            <h1 class="text-2xl font-bold">{{ school.name }}</h1>
          </div>
          <p v-if="school.address" class="text-gray-500 ml-10 mt-1">{{ school.address }}</p>
        </div>
      </div>

      <!-- Schedule Types -->
      <section class="mb-8">
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-lg font-semibold">Schedule Types</h2>
          <UButton size="sm" icon="i-heroicons-plus" variant="soft" @click="showTypeModal = true">Add</UButton>
        </div>
        <div v-if="!scheduleTypes?.length" class="text-gray-400 text-sm p-4 border rounded">
          No schedule types yet. Add one to get started.
        </div>
        <div v-else class="flex flex-wrap gap-2">
          <UBadge v-for="st in scheduleTypes" :key="st.id" color="blue" size="lg">{{ st.name }}</UBadge>
        </div>
      </section>

      <!-- School Years -->
      <section>
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-lg font-semibold">School Years</h2>
          <UButton size="sm" icon="i-heroicons-plus" variant="soft" :disabled="!scheduleTypes?.length" @click="showYearModal = true">Add</UButton>
        </div>
        <div v-if="!schoolYears?.length" class="text-gray-400 text-sm p-4 border rounded">
          No school years yet.
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <UCard
            v-for="year in schoolYears"
            :key="year.id"
            class="cursor-pointer hover:ring-1 ring-primary-400 transition"
            @click="router.push(`/schools/${school.id}/school-years/${year.id}`)"
          >
            <div class="flex justify-between items-center">
              <span class="font-medium">{{ year.label }}</span>
              <UBadge :color="year.isActive ? 'green' : 'gray'" size="sm">
                {{ year.isActive ? 'Active' : 'Inactive' }}
              </UBadge>
            </div>
            <p class="text-xs text-gray-400 mt-1">
              {{ scheduleTypes?.find(t => t.id === year.scheduleTypeId)?.name ?? '' }}
            </p>
          </UCard>
        </div>
      </section>
    </div>
    <div v-else-if="pending" class="text-gray-400 py-20 text-center">Loading...</div>

    <!-- Add Schedule Type Modal -->
    <UModal v-model="showTypeModal">
      <UCard>
        <template #header><h3 class="font-semibold">Add Schedule Type</h3></template>
        <div class="space-y-3">
          <USelect v-model="newTypeName" :options="TYPE_OPTIONS" placeholder="Select type" />
          <div class="flex gap-2">
            <UButton :loading="saving" :disabled="!newTypeName" @click="addType">Create</UButton>
            <UButton variant="ghost" color="gray" @click="showTypeModal = false">Cancel</UButton>
          </div>
        </div>
      </UCard>
    </UModal>

    <!-- Add School Year Modal -->
    <UModal v-model="showYearModal">
      <UCard>
        <template #header><h3 class="font-semibold">Add School Year</h3></template>
        <div class="space-y-3">
          <UFormGroup label="Label">
            <UInput v-model="newYearLabel" placeholder="e.g. 2024-2025" />
          </UFormGroup>
          <UFormGroup label="Schedule Type">
            <USelect
              v-model="newYearTypeId"
              :options="scheduleTypes?.map(t => ({ label: t.name, value: t.id })) ?? []"
              placeholder="Select type"
            />
          </UFormGroup>
          <div class="flex gap-2">
            <UButton :loading="saving" :disabled="!newYearLabel || !newYearTypeId" @click="addYear">Create</UButton>
            <UButton variant="ghost" color="gray" @click="showYearModal = false">Cancel</UButton>
          </div>
        </div>
      </UCard>
    </UModal>
  </UContainer>
</template>

<script setup lang="ts">
import type { School, ScheduleType, SchoolYear } from '~/types'

const TYPE_OPTIONS = ['Junior High School']
const route = useRoute()
const router = useRouter()
const schoolId = parseInt(route.params.id as string)

const { data: school, pending } = await useFetch<School>(`/api/schools/${schoolId}`)
const { data: scheduleTypes, refresh: refreshTypes } = await useFetch<ScheduleType[]>('/api/schedule-types', { query: { schoolId } })
const { data: schoolYears, refresh: refreshYears } = await useFetch<SchoolYear[]>('/api/school-years', { query: { schoolId } })

const showTypeModal = ref(false)
const showYearModal = ref(false)
const newTypeName = ref('')
const newYearLabel = ref('')
const newYearTypeId = ref<number | null>(null)
const saving = ref(false)

async function addType() {
  saving.value = true
  await $fetch('/api/schedule-types', { method: 'POST', body: { schoolId, name: newTypeName.value } })
  await refreshTypes()
  showTypeModal.value = false
  newTypeName.value = ''
  saving.value = false
}

async function addYear() {
  saving.value = true
  await $fetch('/api/school-years', { method: 'POST', body: { schoolId, scheduleTypeId: newYearTypeId.value, label: newYearLabel.value } })
  await refreshYears()
  showYearModal.value = false
  newYearLabel.value = ''
  newYearTypeId.value = null
  saving.value = false
}
</script>
