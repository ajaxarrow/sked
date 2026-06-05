<template>
  <UContainer class="py-10">
    <div class="flex items-center gap-3 mb-6">
      <UButton :to="`/schools/${schoolId}/school-years/${yearId}`" variant="ghost" icon="i-heroicons-arrow-left" size="sm" />
      <div class="flex-1">
        <h1 class="text-xl font-bold">Teachers</h1>
        <p class="text-sm text-gray-500">{{ year?.label }}</p>
      </div>
      <UButton icon="i-heroicons-plus" @click="openNew">Add Teacher</UButton>
    </div>

    <div v-if="!teachers?.length" class="text-center py-16 text-gray-400 border rounded">
      No teachers yet.
    </div>
    <div v-else class="grid gap-3">
      <UCard v-for="teacher in teachers" :key="teacher.id">
        <div class="flex justify-between items-start">
          <div>
            <p class="font-semibold">{{ teacher.name }}</p>
            <p class="text-xs text-gray-500 mt-0.5">
              Max {{ teacher.maxHoursPerWeek }} hrs/week · {{ teacher.maxHoursPerDay }} hrs/day
            </p>
            <div class="flex flex-wrap gap-1 mt-2">
              <UBadge
                v-for="s in teacher.subjects"
                :key="s.id"
                color="blue"
                variant="subtle"
                size="xs"
              >
                {{ s.subjectName }} — {{ s.yearLevelName }}
              </UBadge>
              <span v-if="!teacher.subjects.length" class="text-xs text-gray-400">No subjects assigned</span>
            </div>
          </div>
          <div class="flex gap-2">
            <UButton size="xs" variant="soft" @click="openEdit(teacher)">Edit</UButton>
            <UButton size="xs" color="red" variant="soft" @click="deleteTeacher(teacher.id)">Delete</UButton>
          </div>
        </div>
      </UCard>
    </div>

    <UModal v-model="showModal">
      <UCard class="max-w-2xl w-full">
        <template #header>
          <h3 class="font-semibold">{{ editing ? 'Edit Teacher' : 'New Teacher' }}</h3>
        </template>
        <div class="space-y-4">
          <UFormGroup label="Full Name" required>
            <UInput v-model="form.name" placeholder="Juan dela Cruz" />
          </UFormGroup>
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Max Hours / Week">
              <UInput v-model.number="form.maxHoursPerWeek" type="number" min="1" max="60" />
            </UFormGroup>
            <UFormGroup label="Max Hours / Day">
              <UInput v-model.number="form.maxHoursPerDay" type="number" min="1" max="12" />
            </UFormGroup>
          </div>
          <UFormGroup label="Subjects Handled">
            <SubjectYearPicker
              v-if="subjects && yearLevels"
              :subjects="subjects"
              :year-levels="yearLevels"
              v-model="form.assignments"
            />
            <p v-else class="text-sm text-gray-400">Loading subjects...</p>
          </UFormGroup>
          <div class="flex gap-2 pt-1">
            <UButton :loading="saving" :disabled="!form.name" @click="save">
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
import type { Teacher, Subject, YearLevel, SchoolYear } from '~/types'
const route = useRoute()
const schoolId = parseInt(route.params.id as string)
const yearId = parseInt(route.params.yearId as string)

const { data: year } = await useFetch<SchoolYear>(`/api/school-years/${yearId}`)
const { data: teachers, refresh } = await useFetch<Teacher[]>('/api/teachers', { query: { schoolId } })
const { data: subjects } = await useFetch<Subject[]>('/api/subjects', {
  query: computed(() => ({ scheduleTypeId: year.value?.scheduleTypeId })),
})
const { data: yearLevels } = await useFetch<YearLevel[]>('/api/year-levels', {
  query: computed(() => ({ scheduleTypeId: year.value?.scheduleTypeId })),
})

const showModal = ref(false)
const editing = ref<number | null>(null)
const saving = ref(false)
const form = reactive({
  name: '',
  maxHoursPerWeek: 40,
  maxHoursPerDay: 8,
  assignments: [] as Array<{ subjectId: number; yearLevelId: number }>,
})

function openNew() {
  editing.value = null
  form.name = ''; form.maxHoursPerWeek = 40; form.maxHoursPerDay = 8; form.assignments = []
  showModal.value = true
}

function openEdit(t: Teacher) {
  editing.value = t.id
  form.name = t.name
  form.maxHoursPerWeek = t.maxHoursPerWeek
  form.maxHoursPerDay = t.maxHoursPerDay
  form.assignments = t.subjects.map(s => ({ subjectId: s.subjectId, yearLevelId: s.yearLevelId }))
  showModal.value = true
}

async function save() {
  saving.value = true
  if (editing.value) {
    await $fetch(`/api/teachers/${editing.value}`, { method: 'PUT', body: { ...form, schoolId } })
  } else {
    await $fetch('/api/teachers', { method: 'POST', body: { ...form, schoolId } })
  }
  await refresh()
  showModal.value = false
  saving.value = false
}

async function deleteTeacher(id: number) {
  if (!confirm('Delete this teacher?')) return
  await $fetch(`/api/teachers/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>
