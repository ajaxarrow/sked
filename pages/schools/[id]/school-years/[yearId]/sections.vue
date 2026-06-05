<template>
  <UContainer class="py-10">
    <div class="flex items-center gap-3 mb-6">
      <UButton :to="`/schools/${schoolId}/school-years/${yearId}`" variant="ghost" icon="i-heroicons-arrow-left" size="sm" />
      <div class="flex-1">
        <h1 class="text-xl font-bold">Sections — {{ year?.label }}</h1>
      </div>
      <UButton icon="i-heroicons-plus" @click="openNew">Add Section</UButton>
    </div>

    <div v-if="!sections?.length" class="text-center py-16 text-gray-400 border rounded">
      No sections yet. Add one to start scheduling.
    </div>
    <UTable v-else :rows="sections" :columns="columns">
      <template #yearLevelName-data="{ row }">{{ row.yearLevelName }}</template>
      <template #adviserName-data="{ row }">{{ row.adviserName ?? '—' }}</template>
      <template #actions-data="{ row }">
        <div class="flex gap-2 justify-end">
          <UButton size="xs" color="green" variant="soft" :to="`/schools/${schoolId}/school-years/${yearId}/schedule/${row.id}`">
            Schedule
          </UButton>
          <UButton size="xs" variant="soft" @click="openEdit(row)">Edit</UButton>
          <UButton size="xs" color="red" variant="soft" @click="deleteSection(row.id)">Delete</UButton>
        </div>
      </template>
    </UTable>

    <UModal v-model="showModal">
      <UCard>
        <template #header>
          <h3 class="font-semibold">{{ editing ? 'Edit Section' : 'New Section' }}</h3>
        </template>
        <div class="space-y-4">
          <UFormGroup label="Section Name" required>
            <UInput v-model="form.name" placeholder="e.g. Rizal, Bonifacio" />
          </UFormGroup>
          <UFormGroup label="Year Level" required>
            <USelect
              v-model="form.yearLevelId"
              :options="yearLevels?.map(yl => ({ label: yl.name, value: yl.id })) ?? []"
              placeholder="Select year level"
            />
          </UFormGroup>
          <UFormGroup label="Adviser">
            <USelect
              v-model="form.adviserId"
              :options="[{ label: 'None', value: null }, ...(teachers?.map(t => ({ label: t.name, value: t.id })) ?? [])]"
              placeholder="Select adviser"
            />
          </UFormGroup>
          <div class="flex gap-2 pt-1">
            <UButton :loading="saving" :disabled="!form.name || !form.yearLevelId" @click="save">
              {{ editing ? 'Update' : 'Create' }}
            </UButton>
            <UButton variant="ghost" color="gray" @click="showModal = false">Cancel</UButton>
          </div>
        </div>
      </UCard>
    </UModal>
  </UContainer>
</template>

<script setup lang="ts">
import type { Section, SchoolYear, YearLevel, Teacher } from '~/types'
const route = useRoute()
const schoolId = parseInt(route.params.id as string)
const yearId = parseInt(route.params.yearId as string)

const { data: year } = await useFetch<SchoolYear>(`/api/school-years/${yearId}`)
const { data: sections, refresh } = await useFetch<Section[]>('/api/sections', { query: { schoolYearId: yearId } })
const { data: yearLevels } = await useFetch<YearLevel[]>('/api/year-levels', {
  query: computed(() => ({ scheduleTypeId: year.value?.scheduleTypeId })),
})
const { data: teachers } = await useFetch<Teacher[]>('/api/teachers', { query: { schoolId } })

const columns = [
  { key: 'name', label: 'Section' },
  { key: 'yearLevelName', label: 'Year Level' },
  { key: 'adviserName', label: 'Adviser' },
  { key: 'actions', label: '' },
]

const showModal = ref(false)
const editing = ref<number | null>(null)
const saving = ref(false)
const form = reactive({ name: '', yearLevelId: null as number | null, adviserId: null as number | null })

function openNew() {
  editing.value = null
  form.name = ''; form.yearLevelId = null; form.adviserId = null
  showModal.value = true
}

function openEdit(row: Section) {
  editing.value = row.id
  form.name = row.name
  form.yearLevelId = row.yearLevelId
  form.adviserId = row.adviserId
  showModal.value = true
}

async function save() {
  saving.value = true
  if (editing.value) {
    await $fetch(`/api/sections/${editing.value}`, { method: 'PUT', body: form })
  } else {
    await $fetch('/api/sections', { method: 'POST', body: { ...form, schoolYearId: yearId } })
  }
  await refresh()
  showModal.value = false
  editing.value = null
  saving.value = false
}

async function deleteSection(id: number) {
  if (!confirm('Delete this section and its schedule?')) return
  await $fetch(`/api/sections/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>
