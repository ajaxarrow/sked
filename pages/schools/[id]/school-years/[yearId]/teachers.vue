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
          <div class="search-input" style="flex:1; max-width:18rem">
            <UIcon name="i-heroicons-magnifying-glass" class="search-icon" />
            <input
              v-model="search"
              class="form-input"
              style="padding-left:2rem; background:white; font-size:0.8125rem"
              placeholder="Search teachers…"
            />
          </div>
          <span class="text-sm ml-auto" style="color:var(--color-muted)">
            {{ filteredTeachers.length }} {{ filteredTeachers.length === 1 ? 'teacher' : 'teachers' }}
          </span>
        </div>

        <!-- Table -->
        <div class="data-table">
          <table>
            <thead>
              <tr>
                <th style="width:28%">Teacher</th>
                <th style="width:38%">Subject Assignments</th>
                <th style="width:12%; text-align:center">Hrs/Week</th>
                <th style="width:12%; text-align:center">Hrs/Day</th>
                <th style="width:10%; text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!filteredTeachers.length">
                <td colspan="5" style="padding:3rem; text-align:center">
                  <div class="empty-state" style="padding:0">
                    <UIcon name="i-heroicons-user-group" class="empty-state-icon" />
                    <p class="empty-state-title">{{ search ? 'No teachers match' : 'No teachers yet' }}</p>
                    <p class="empty-state-desc">{{ search ? 'Try a different search.' : 'Add your first teacher to get started.' }}</p>
                  </div>
                </td>
              </tr>
              <tr v-for="teacher in filteredTeachers" :key="teacher.id">
                <!-- Name + color dot -->
                <td>
                  <div class="flex items-center gap-2.5">
                    <span
                      class="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                      :style="{ background: teacher.colorHex ?? '#6366f1' }"
                    >
                      {{ teacher.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('') }}
                    </span>
                    <div>
                      <p class="text-sm font-semibold" style="color:var(--color-ink)">{{ teacher.name }}</p>
                    </div>
                  </div>
                </td>
                <!-- Subject chips -->
                <td>
                  <div class="flex flex-wrap gap-1.5">
                    <template v-if="teacher.subjects.length">
                      <span
                        v-for="s in teacher.subjects"
                        :key="s.id"
                        class="subject-chip"
                        :style="{
                          background: (s.subjectColor ?? '#6366f1') + '1a',
                          color: s.subjectColor ?? '#6366f1',
                        }"
                      >
                        <span class="subject-chip-dot" :style="{ background: s.subjectColor ?? '#6366f1' }" />
                        {{ s.sectionCount }}× {{ s.subjectName }}
                        <span style="opacity:0.65; font-weight:400">· {{ s.yearLevelName }}</span>
                      </span>
                    </template>
                    <span v-else class="text-xs" style="color:var(--color-placeholder)">No subjects assigned</span>
                  </div>
                </td>
                <!-- Hours -->
                <td style="text-align:center">
                  <span class="text-sm font-medium" style="color:var(--color-ink)">{{ teacher.maxHoursPerWeek }}</span>
                </td>
                <td style="text-align:center">
                  <span class="text-sm font-medium" style="color:var(--color-ink)">{{ teacher.maxHoursPerDay }}</span>
                </td>
                <!-- Actions -->
                <td>
                  <div class="flex items-center justify-end gap-1">
                    <button class="btn-icon" title="Edit teacher" @click="openEdit(teacher)">
                      <UIcon name="i-heroicons-pencil" class="w-4 h-4" />
                    </button>
                    <button class="btn-icon danger" title="Delete teacher" @click="deleteTeacher(teacher.id)">
                      <UIcon name="i-heroicons-trash" class="w-4 h-4" />
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
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-panel" style="max-width:42rem">
          <div class="modal-header">
            <h3 class="modal-title">{{ editing ? 'Edit Teacher' : 'New Teacher' }}</h3>
            <button class="modal-close" @click="showModal = false">
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>
          <div class="modal-body">
            <!-- Tabs -->
            <div class="flex border-b mb-5" style="border-color:var(--color-border)">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
                :class="activeTab === tab.id
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'"
                style="margin-bottom:-1px"
                @click="activeTab = tab.id"
              >
                {{ tab.label }}
              </button>
            </div>

            <!-- Profile tab -->
            <div v-if="activeTab === 'profile'" class="space-y-4">
              <div>
                <label class="form-label">Full Name <span style="color:var(--color-danger)">*</span></label>
                <input v-model="form.name" class="form-input" placeholder="Juan dela Cruz" />
              </div>
              <div>
                <label class="form-label">Color</label>
                <div class="flex items-center gap-3">
                  <input
                    v-model="form.colorHex"
                    type="color"
                    class="w-10 h-10 rounded cursor-pointer border"
                    style="padding:2px; border-color:var(--color-border)"
                  />
                  <div class="flex gap-1.5 flex-wrap">
                    <button
                      v-for="c in PRESET_COLORS"
                      :key="c"
                      class="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                      :style="{ background: c, borderColor: form.colorHex === c ? 'var(--color-ink)' : 'transparent' }"
                      @click="form.colorHex = c"
                    />
                  </div>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Max Teaching Hrs / Week</label>
                  <input v-model.number="form.maxHoursPerWeek" class="form-input" type="number" min="1" max="40" />
                  <p class="text-xs mt-1" style="color:var(--color-muted)">DepEd default: 30 hrs</p>
                </div>
                <div>
                  <label class="form-label">Max Teaching Hrs / Day</label>
                  <input v-model.number="form.maxHoursPerDay" class="form-input" type="number" min="1" max="10" />
                  <p class="text-xs mt-1" style="color:var(--color-muted)">DepEd default: 6 hrs</p>
                </div>
              </div>
            </div>

            <!-- Subjects tab -->
            <div v-if="activeTab === 'subjects'">
              <p class="text-sm mb-3" style="color:var(--color-muted)">
                Select the subjects this teacher handles and specify the number of sections per subject–year combination.
              </p>
              <TeachersSubjectYearPicker
                v-if="subjects && yearLevels"
                :subjects="subjects"
                :year-levels="yearLevels"
                v-model="form.assignments"
              />
              <p v-else class="text-sm" style="color:var(--color-muted)">Loading…</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showModal = false">Cancel</button>
            <button class="btn-primary" :disabled="!form.name || saving" @click="save">
              <UIcon v-if="saving" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              {{ editing ? 'Update Teacher' : 'Create Teacher' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Teacher, Subject, YearLevel, SchoolYear } from '~/types'

const PRESET_COLORS = [
  '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6',
  '#10b981', '#22c55e', '#84cc16', '#eab308',
  '#f59e0b', '#f97316', '#ef4444', '#ec4899',
  '#d946ef', '#a855f7', '#8b5cf6', '#6366f1',
]

const route = useRoute()
const schoolId = route.params.id as string
const yearId = route.params.yearId as string

const { data: year } = await useFetch<SchoolYear>(`/api/school-years/${yearId}`)
const scheduleTypeId = computed(() => year.value?.scheduleTypeId)

const { data: teachers, refresh } = await useFetch<Teacher[]>('/api/teachers', { query: { schoolId } })
const { data: subjects } = await useFetch<Subject[]>('/api/subjects', { query: { scheduleTypeId } })
const { data: yearLevels } = await useFetch<YearLevel[]>('/api/year-levels', { query: { scheduleTypeId } })

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
  colorHex: '#6366f1',
  maxHoursPerWeek: 30,
  maxHoursPerDay: 6,
  assignments: [] as Array<{ subjectId: number; yearLevelId: number; sectionCount: number }>,
})

function openNew() {
  editing.value = null
  form.name = ''
  form.colorHex = '#6366f1'
  form.maxHoursPerWeek = 30
  form.maxHoursPerDay = 6
  form.assignments = []
  activeTab.value = 'profile'
  showModal.value = true
}

function openEdit(t: Teacher) {
  editing.value = t.id
  form.name = t.name
  form.colorHex = t.colorHex ?? '#6366f1'
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
