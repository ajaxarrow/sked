<template>
  <div>
    <div class="page-header">
      <div class="breadcrumb mb-2">
        <NuxtLink to="/">Schools</NuxtLink>
        <span class="breadcrumb-sep">/</span>
        <NuxtLink :to="`/schools/${schoolId}`">School</NuxtLink>
        <span class="breadcrumb-sep">/</span>
        <NuxtLink :to="`/schools/${schoolId}/school-years/${yearId}`">{{ year?.label }}</NuxtLink>
        <span class="breadcrumb-sep">/</span>
        <span>Teachers</span>
      </div>
      <div class="flex items-center justify-between">
        <div>
          <h1 class="page-title">Teachers</h1>
          <p class="page-sub">{{ year?.label }}</p>
        </div>
        <button class="btn-primary" @click="openNew">
          <UIcon name="i-heroicons-plus" class="w-4 h-4" />
          Add Teacher
        </button>
      </div>
    </div>

    <div class="page-body">
      <div class="data-table-wrapper">
        <!-- Toolbar -->
        <div class="data-table-toolbar">
          <div class="search-input flex-1 max-w-xs">
            <UIcon name="i-heroicons-magnifying-glass" class="search-icon" />
            <input v-model="search" class="form-input" style="padding-left: 2rem; background: white" placeholder="Search teachers..." />
          </div>
          <span class="text-sm" style="color: var(--color-muted)">{{ filteredTeachers.length }} teachers</span>
        </div>

        <!-- Table -->
        <div class="data-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Max Hrs/Week</th>
                <th>Max Hrs/Day</th>
                <th>Subject Assignments</th>
                <th style="text-align: right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!filteredTeachers.length">
                <td colspan="5" style="padding: 2.5rem; text-align: center">
                  <div class="empty-state" style="padding: 0">
                    <UIcon name="i-heroicons-user-group" class="empty-state-icon" />
                    <p class="empty-state-title">{{ search ? 'No teachers match' : 'No teachers yet' }}</p>
                    <p class="empty-state-desc">{{ search ? 'Try a different search term.' : 'Add your first teacher to get started.' }}</p>
                  </div>
                </td>
              </tr>
              <tr v-for="teacher in filteredTeachers" :key="teacher.id">
                <td>
                  <p class="font-medium" style="color: var(--color-ink)">{{ teacher.name }}</p>
                </td>
                <td>
                  <span class="text-sm" style="color: var(--color-muted)">{{ teacher.maxHoursPerWeek }} hrs</span>
                </td>
                <td>
                  <span class="text-sm" style="color: var(--color-muted)">{{ teacher.maxHoursPerDay }} hrs</span>
                </td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="s in teacher.subjects"
                      :key="s.id"
                      class="badge badge-primary"
                    >
                      {{ s.sectionCount }}× {{ s.subjectName }} {{ s.yearLevelName }}
                    </span>
                    <span v-if="!teacher.subjects.length" class="text-xs" style="color: var(--color-placeholder)">None assigned</span>
                  </div>
                </td>
                <td>
                  <div class="flex justify-end gap-2">
                    <button class="btn-ghost" style="padding: 0.25rem 0.625rem; font-size: 0.8125rem" @click="openEdit(teacher)">
                      <UIcon name="i-heroicons-pencil-square" class="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button class="btn-danger" style="padding: 0.25rem 0.625rem; font-size: 0.8125rem" @click="deleteTeacher(teacher.id)">
                      <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Teacher Modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-panel" style="max-width: 42rem">
          <div class="modal-header">
            <h3 class="modal-title">{{ editing ? 'Edit Teacher' : 'New Teacher' }}</h3>
            <button @click="showModal = false" style="color: var(--color-muted)">
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>
          <div class="modal-body">
            <!-- Tab navigation -->
            <div class="flex border-b mb-5" style="border-color: var(--color-border)">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
                :class="activeTab === tab.id
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'"
                style="margin-bottom: -1px"
                @click="activeTab = tab.id"
              >
                {{ tab.label }}
              </button>
            </div>

            <!-- Profile tab -->
            <div v-if="activeTab === 'profile'" class="space-y-4">
              <div>
                <label class="form-label">Full Name <span style="color: var(--color-danger)">*</span></label>
                <input v-model="form.name" class="form-input" placeholder="Juan dela Cruz" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Max Teaching Hrs / Week</label>
                  <input v-model.number="form.maxHoursPerWeek" class="form-input" type="number" min="1" max="40" />
                  <p class="text-xs mt-1" style="color: var(--color-muted)">DepEd default: 30 hrs</p>
                </div>
                <div>
                  <label class="form-label">Max Teaching Hrs / Day</label>
                  <input v-model.number="form.maxHoursPerDay" class="form-input" type="number" min="1" max="10" />
                  <p class="text-xs mt-1" style="color: var(--color-muted)">DepEd default: 6 hrs</p>
                </div>
              </div>
            </div>

            <!-- Subjects tab -->
            <div v-if="activeTab === 'subjects'">
              <p class="text-sm mb-3" style="color: var(--color-muted)">
                Select the subjects this teacher handles and specify the number of sections per subject-year combination.
              </p>
              <TeachersSubjectYearPicker
                v-if="subjects && yearLevels"
                :subjects="subjects"
                :year-levels="yearLevels"
                v-model="form.assignments"
              />
              <p v-else class="text-sm" style="color: var(--color-muted)">Loading subjects...</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showModal = false">Cancel</button>
            <button class="btn-primary" :disabled="!form.name || saving" @click="save">
              <UIcon v-if="saving" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              {{ editing ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Teacher, Subject, YearLevel, SchoolYear } from '~/types'

const route = useRoute()
const schoolId = route.params.id as string
const yearId = route.params.yearId as string

const { data: year } = await useFetch<SchoolYear>(`/api/school-years/${yearId}`)
const scheduleTypeId = year.value?.scheduleTypeId

const { data: teachers, refresh } = await useFetch<Teacher[]>('/api/teachers', { query: { schoolId } })
const { data: subjects } = await useFetch<Subject[]>('/api/subjects', {
  query: { scheduleTypeId },
})
const { data: yearLevels } = await useFetch<YearLevel[]>('/api/year-levels', {
  query: { scheduleTypeId },
})

const search = ref('')
const filteredTeachers = computed(() => {
  const q = search.value.toLowerCase()
  return (teachers.value ?? []).filter(t => !q || t.name.toLowerCase().includes(q))
})

const tabs = [
  { id: 'profile', label: 'Profile' },
  { id: 'subjects', label: 'Subject Assignments' },
]
const activeTab = ref<'profile' | 'subjects'>('profile')
const showModal = ref(false)
const editing = ref<string | null>(null)
const saving = ref(false)
const form = reactive({
  name: '',
  maxHoursPerWeek: 30,
  maxHoursPerDay: 6,
  assignments: [] as Array<{ subjectId: number; yearLevelId: number; sectionCount: number }>,
})

function openNew() {
  editing.value = null
  form.name = ''
  form.maxHoursPerWeek = 30
  form.maxHoursPerDay = 6
  form.assignments = []
  activeTab.value = 'profile'
  showModal.value = true
}

function openEdit(t: Teacher) {
  editing.value = t.id
  form.name = t.name
  form.maxHoursPerWeek = t.maxHoursPerWeek
  form.maxHoursPerDay = t.maxHoursPerDay
  form.assignments = t.subjects.map(s => ({ subjectId: s.subjectId, yearLevelId: s.yearLevelId, sectionCount: s.sectionCount }))
  activeTab.value = 'profile'
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

async function deleteTeacher(id: string) {
  if (!confirm('Delete this teacher? This cannot be undone.')) return
  await $fetch(`/api/teachers/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>
