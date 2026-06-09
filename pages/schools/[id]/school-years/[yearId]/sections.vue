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
          <div class="search-input" style="flex:1; max-width:18rem">
            <UIcon name="i-heroicons-magnifying-glass" class="search-icon" />
            <input
              v-model="search"
              class="form-input"
              style="padding-left:2rem; background:white; font-size:0.8125rem"
              placeholder="Search sections…"
            />
          </div>
          <span class="text-sm ml-auto" style="color:var(--color-muted)">
            {{ filteredSections.length }} {{ filteredSections.length === 1 ? 'section' : 'sections' }}
          </span>
        </div>

        <!-- Table -->
        <div class="data-table">
          <table>
            <thead>
              <tr>
                <th style="width:35%">Section</th>
                <th style="width:20%">Year Level</th>
                <th style="width:35%">Adviser</th>
                <th style="width:10%; text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!filteredSections.length">
                <td colspan="4" style="padding:3rem; text-align:center">
                  <div class="empty-state" style="padding:0">
                    <UIcon name="i-heroicons-rectangle-stack" class="empty-state-icon" />
                    <p class="empty-state-title">{{ search ? 'No sections match' : 'No sections yet' }}</p>
                    <p class="empty-state-desc">{{ search ? 'Try a different search.' : 'Add your first section to start scheduling.' }}</p>
                  </div>
                </td>
              </tr>
              <tr v-for="section in filteredSections" :key="section.id">
                <!-- Section name -->
                <td>
                  <div class="flex items-center gap-2.5">
                    <div
                      class="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold"
                      style="background:var(--color-primary-light); color:var(--color-primary)"
                    >
                      {{ sectionInitials(section.name) }}
                    </div>
                    <p class="text-sm font-semibold" style="color:var(--color-ink)">{{ section.name }}</p>
                  </div>
                </td>
                <!-- Year level badge -->
                <td>
                  <span v-if="section.yearLevelName" class="badge badge-primary">
                    {{ section.yearLevelName }}
                  </span>
                  <span v-else class="text-sm" style="color:var(--color-placeholder)">—</span>
                </td>
                <!-- Adviser -->
                <td>
                  <span v-if="section.adviserName" class="text-sm" style="color:var(--color-ink)">
                    {{ section.adviserName }}
                  </span>
                  <span v-else class="text-sm" style="color:var(--color-placeholder)">No adviser assigned</span>
                </td>
                <!-- Actions -->
                <td>
                  <div class="flex items-center justify-end gap-1">
                    <button class="btn-icon" title="Edit section" @click="openEdit(section)">
                      <UIcon name="i-heroicons-pencil" class="w-4 h-4" />
                    </button>
                    <button class="btn-icon danger" title="Delete section" @click="deleteSection(section.id)">
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

  <!-- Section Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-panel">
          <div class="modal-header">
            <h3 class="modal-title">{{ editing ? 'Edit Section' : 'New Section' }}</h3>
            <button class="modal-close" @click="showModal = false">
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>
          <div class="modal-body space-y-4">
            <div>
              <label class="form-label">Section Name <span style="color:var(--color-danger)">*</span></label>
              <input v-model="form.name" class="form-input" placeholder="e.g. Rizal, Bonifacio" />
            </div>
            <div>
              <label class="form-label">Year Level <span style="color:var(--color-danger)">*</span></label>
              <select v-model="form.yearLevelId" class="form-input">
                <option :value="null">Select year level</option>
                <option v-for="yl in yearLevels" :key="yl.id" :value="yl.id">{{ yl.name }}</option>
              </select>
            </div>
            <div>
              <label class="form-label">Adviser</label>
              <select v-model="form.adviserId" class="form-input">
                <option :value="null">No adviser</option>
                <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showModal = false">Cancel</button>
            <button class="btn-primary" :disabled="!form.name || !form.yearLevelId || saving" @click="save">
              <UIcon v-if="saving" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              {{ editing ? 'Update Section' : 'Create Section' }}
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
const scheduleTypeId = computed(() => year.value?.scheduleTypeId)

const { data: sections, refresh } = await useFetch<Section[]>('/api/sections', { query: { schoolYearId: yearId } })
const { data: yearLevels } = await useFetch<YearLevel[]>('/api/year-levels', { query: { scheduleTypeId } })
const { data: teachers } = await useFetch<Teacher[]>('/api/teachers', { query: { schoolId } })

const search = ref('')
const filteredSections = computed(() => {
  const q = search.value.toLowerCase()
  return (sections.value ?? []).filter(s =>
    !q || s.name.toLowerCase().includes(q) || (s.yearLevelName ?? '').toLowerCase().includes(q)
  )
})

function sectionInitials(name: string) {
  const words = name.trim().split(/[\s\-]+/).filter(Boolean)
  if (words.length >= 2) return (words[0]![0]! + words[1]![0]!).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const showModal = ref(false)
const editing = ref<string | null>(null)
const saving = ref(false)
const form = reactive({ name: '', yearLevelId: null as number | null, adviserId: null as string | null })

function openNew() {
  editing.value = null
  form.name = ''
  form.yearLevelId = null
  form.adviserId = null
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
  if (!confirm('Delete this section and all its schedules? This cannot be undone.')) return
  await $fetch(`/api/sections/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>
