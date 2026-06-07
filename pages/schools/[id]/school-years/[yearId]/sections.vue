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
        <span>Sections</span>
      </div>
      <div class="flex items-center justify-between">
        <div>
          <h1 class="page-title">Sections</h1>
          <p class="page-sub">{{ year?.label }}</p>
        </div>
        <button class="btn-primary" @click="openNew">
          <UIcon name="i-heroicons-plus" class="w-4 h-4" />
          Add Section
        </button>
      </div>
    </div>

    <div class="page-body">
      <div class="data-table-wrapper">
        <!-- Toolbar -->
        <div class="data-table-toolbar">
          <div class="search-input flex-1 max-w-xs">
            <UIcon name="i-heroicons-magnifying-glass" class="search-icon" />
            <input v-model="search" class="form-input" style="padding-left: 2rem; background: white" placeholder="Search sections..." />
          </div>
          <span class="text-sm" style="color: var(--color-muted)">{{ filteredSections.length }} sections</span>
        </div>

        <!-- Table -->
        <div class="data-table">
          <table>
            <thead>
              <tr>
                <th>Section Name</th>
                <th>Year Level</th>
                <th>Adviser</th>
                <th style="text-align: right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!filteredSections.length">
                <td colspan="4" style="padding: 2.5rem; text-align: center">
                  <div class="empty-state" style="padding: 0">
                    <UIcon name="i-heroicons-rectangle-stack" class="empty-state-icon" />
                    <p class="empty-state-title">{{ search ? 'No sections match' : 'No sections yet' }}</p>
                    <p class="empty-state-desc">{{ search ? 'Try a different search term.' : 'Add your first section to start scheduling.' }}</p>
                  </div>
                </td>
              </tr>
              <tr v-for="section in filteredSections" :key="section.id">
                <td>
                  <p class="font-medium" style="color: var(--color-ink)">{{ section.name }}</p>
                </td>
                <td>
                  <span v-if="section.yearLevelName" class="badge badge-primary">{{ section.yearLevelName }}</span>
                </td>
                <td>
                  <span class="text-sm" style="color: var(--color-muted)">{{ section.adviserName ?? '—' }}</span>
                </td>
                <td>
                  <div class="flex justify-end gap-2">
                    <button class="btn-ghost" style="padding: 0.25rem 0.625rem; font-size: 0.8125rem" @click="openEdit(section)">
                      <UIcon name="i-heroicons-pencil-square" class="w-3.5 h-3.5" />
                    </button>
                    <button class="btn-danger" style="padding: 0.25rem 0.625rem; font-size: 0.8125rem" @click="deleteSection(section.id)">
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

  <!-- Section Modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-panel">
          <div class="modal-header">
            <h3 class="modal-title">{{ editing ? 'Edit Section' : 'New Section' }}</h3>
            <button @click="showModal = false" style="color: var(--color-muted)">
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>
          <div class="modal-body space-y-4">
            <div>
              <label class="form-label">Section Name <span style="color: var(--color-danger)">*</span></label>
              <input v-model="form.name" class="form-input" placeholder="e.g. Rizal, Bonifacio" />
            </div>
            <div>
              <label class="form-label">Year Level <span style="color: var(--color-danger)">*</span></label>
              <select v-model="form.yearLevelId" class="form-input">
                <option :value="null">Select year level</option>
                <option v-for="yl in yearLevels" :key="yl.id" :value="yl.id">{{ yl.name }}</option>
              </select>
            </div>
            <div>
              <label class="form-label">Adviser</label>
              <select v-model="form.adviserId" class="form-input">
                <option :value="null">None</option>
                <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showModal = false">Cancel</button>
            <button class="btn-primary" :disabled="!form.name || !form.yearLevelId || saving" @click="save">
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
import type { Section, SchoolYear, YearLevel, Teacher } from '~/types'

const route = useRoute()
const schoolId = route.params.id as string
const yearId = route.params.yearId as string

const { data: year } = await useFetch<SchoolYear>(`/api/school-years/${yearId}`)
const scheduleTypeId = year.value?.scheduleTypeId

const { data: sections, refresh } = await useFetch<Section[]>('/api/sections', { query: { schoolYearId: yearId } })
const { data: yearLevels } = await useFetch<YearLevel[]>('/api/year-levels', {
  query: { scheduleTypeId },
})
const { data: teachers } = await useFetch<Teacher[]>('/api/teachers', { query: { schoolId } })

const search = ref('')
const filteredSections = computed(() => {
  const q = search.value.toLowerCase()
  return (sections.value ?? []).filter(s => !q || s.name.toLowerCase().includes(q) || (s.yearLevelName ?? '').toLowerCase().includes(q))
})

const showModal = ref(false)
const editing = ref<string | null>(null)
const saving = ref(false)
const form = reactive({ name: '', yearLevelId: null as number | null, adviserId: null as string | null })

function openNew() {
  editing.value = null
  form.name = ''; form.yearLevelId = null; form.adviserId = null
  showModal.value = true
}

function openEdit(row: Section) {
  editing.value = row.id
  form.name = row.name
  form.yearLevelId = row.yearLevelId
  form.adviserId = row.adviserId ?? null
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

async function deleteSection(id: string) {
  if (!confirm('Delete this section and all its schedules?')) return
  await $fetch(`/api/sections/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>
