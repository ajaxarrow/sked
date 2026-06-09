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
        <span>Subjects</span>
      </div>
      <div class="flex items-center justify-between">
        <div>
          <h1 class="page-title">Subjects</h1>
          <p class="page-sub">{{ year?.label }}</p>
        </div>
        <button class="btn-primary" @click="openNew">
          <UIcon name="i-heroicons-plus" class="w-4 h-4" />
          Add Subject
        </button>
      </div>
    </div>

    <div class="page-body">
      <div class="data-table-wrapper">
        <div class="data-table-toolbar">
          <div class="search-input flex-1 max-w-xs">
            <UIcon name="i-heroicons-magnifying-glass" class="search-icon" />
            <input v-model="search" class="form-input" style="padding-left: 2rem; background: white" placeholder="Search subjects..." />
          </div>
          <span class="text-sm" style="color: var(--color-muted)">{{ filtered.length }} subjects</span>
        </div>

        <div class="data-table">
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Hours / Week</th>
                <th>Color</th>
                <th style="text-align: right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!filtered.length">
                <td colspan="4" style="padding: 2.5rem; text-align: center">
                  <div class="empty-state" style="padding: 0">
                    <UIcon name="i-heroicons-book-open" class="empty-state-icon" />
                    <p class="empty-state-title">{{ search ? 'No subjects match' : 'No subjects yet' }}</p>
                    <p class="empty-state-desc">{{ search ? 'Try a different search term.' : 'Add your first subject to get started.' }}</p>
                  </div>
                </td>
              </tr>
              <tr v-for="s in filtered" :key="s.id">
                <td>
                  <p class="font-medium" style="color: var(--color-ink)">{{ s.name }}</p>
                </td>
                <td>
                  <span
                    class="inline-flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded"
                    style="background: var(--color-surface); color: var(--color-ink)"
                  >
                    <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5" />
                    {{ s.hoursPerWeek }} hrs/wk
                  </span>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <span
                      class="w-5 h-5 rounded-full border border-white shadow-sm flex-shrink-0"
                      :style="{ background: s.colorHex }"
                    />
                    <span class="text-xs font-mono" style="color: var(--color-muted)">{{ s.colorHex }}</span>
                  </div>
                </td>
                <td style="text-align: right">
                  <div class="flex items-center justify-end gap-2">
                    <button class="btn-ghost btn-sm" @click="openEdit(s)">
                      <UIcon name="i-heroicons-pencil" class="w-4 h-4" />
                    </button>
                    <button class="btn-ghost btn-sm text-red-500" @click="deleteSubject(s.id)">
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

    <!-- Add/Edit Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
          <div class="modal-panel">
            <div class="modal-header">
              <h2 class="modal-title">{{ editing ? 'Edit Subject' : 'Add Subject' }}</h2>
              <button class="modal-close" @click="showModal = false">
                <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
              </button>
            </div>
            <div class="modal-body space-y-4">
              <div>
                <label class="form-label">Subject Name</label>
                <input v-model="form.name" class="form-input" placeholder="e.g. Mathematics" />
              </div>
              <div>
                <label class="form-label">Hours per Week</label>
                <input
                  v-model.number="form.hoursPerWeek"
                  class="form-input"
                  type="number"
                  min="1"
                  max="10"
                />
                <p class="text-xs mt-1" style="color: var(--color-muted)">Number of class periods this subject meets each week.</p>
              </div>
              <div>
                <label class="form-label">Color</label>
                <div class="flex items-center gap-3">
                  <input
                    v-model="form.colorHex"
                    type="color"
                    class="w-10 h-10 rounded cursor-pointer border"
                    style="padding: 2px; border-color: var(--color-border)"
                  />
                  <input
                    v-model="form.colorHex"
                    class="form-input font-mono"
                    placeholder="#6366f1"
                    style="max-width: 120px"
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
  </div>
</template>

<script setup lang="ts">
import type { Subject, SchoolYear } from '~/types'

const PRESET_COLORS = [
  '#3b82f6', '#22c55e', '#ef4444', '#a855f7',
  '#f97316', '#eab308', '#ec4899', '#14b8a6',
  '#6366f1', '#64748b', '#84cc16', '#f43f5e',
]

const route = useRoute()
const schoolId = route.params.id as string
const yearId = route.params.yearId as string

const { data: year } = await useFetch<SchoolYear>(`/api/school-years/${yearId}`)
const scheduleTypeId = computed(() => year.value?.scheduleTypeId)

const { data: subjectList, refresh } = await useFetch<Subject[]>('/api/subjects', {
  query: { scheduleTypeId },
})

const search = ref('')
const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return (subjectList.value ?? []).filter(s => !q || s.name.toLowerCase().includes(q))
})

const showModal = ref(false)
const editing = ref<number | null>(null)
const saving = ref(false)
const form = reactive({ name: '', hoursPerWeek: 4, colorHex: '#6366f1' })

function openNew() {
  editing.value = null
  form.name = ''
  form.hoursPerWeek = 4
  form.colorHex = '#6366f1'
  showModal.value = true
}

function openEdit(s: Subject) {
  editing.value = s.id
  form.name = s.name
  form.hoursPerWeek = s.hoursPerWeek
  form.colorHex = s.colorHex
  showModal.value = true
}

async function save() {
  saving.value = true
  if (editing.value) {
    await $fetch(`/api/subjects/${editing.value}`, { method: 'PUT', body: { ...form } })
  } else {
    await $fetch('/api/subjects', { method: 'POST', body: { ...form, scheduleTypeId: scheduleTypeId.value } })
  }
  await refresh()
  showModal.value = false
  saving.value = false
}

async function deleteSubject(id: number) {
  if (!confirm('Delete this subject? This will affect teacher assignments and schedules.')) return
  await $fetch(`/api/subjects/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>
