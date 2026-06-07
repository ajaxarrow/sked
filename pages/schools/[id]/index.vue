<template>
  <div v-if="school">
    <!-- Page header -->
    <div class="page-header">
      <div class="breadcrumb mb-2">
        <NuxtLink to="/">Schools</NuxtLink>
        <span class="breadcrumb-sep">/</span>
        <span>{{ school.name }}</span>
      </div>
      <div class="flex items-start justify-between">
        <div>
          <h1 class="page-title">{{ school.name }}</h1>
          <p v-if="school.address" class="page-sub">{{ school.address }}</p>
        </div>
      </div>
    </div>

    <div class="page-body space-y-6">
      <!-- Info card -->
      <div class="card">
        <div class="card-header">
          <p class="card-title">School Profile</p>
        </div>
        <div class="card-body grid grid-cols-2 gap-x-8 gap-y-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide" style="color: var(--color-muted)">Address</p>
            <p class="text-sm mt-0.5" style="color: var(--color-ink)">{{ school.address || '—' }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide" style="color: var(--color-muted)">Phone</p>
            <p class="text-sm mt-0.5" style="color: var(--color-ink)">{{ school.phone || '—' }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide" style="color: var(--color-muted)">Email</p>
            <p class="text-sm mt-0.5" style="color: var(--color-ink)">{{ school.email || '—' }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide" style="color: var(--color-muted)">Created</p>
            <p class="text-sm mt-0.5" style="color: var(--color-ink)">{{ school.createdAt ? new Date(school.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' }}</p>
          </div>
        </div>
      </div>

      <!-- Schedule Types -->
      <div class="card">
        <div class="card-header">
          <p class="card-title">Schedule Types</p>
          <button class="btn-primary" style="padding: 0.375rem 0.75rem; font-size: 0.8125rem" @click="showTypeModal = true">
            <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
            Add Type
          </button>
        </div>
        <div class="card-body">
          <div v-if="!scheduleTypes?.length" class="empty-state" style="padding: 1.5rem">
            <p class="empty-state-title" style="font-size: 0.875rem">No schedule types</p>
            <p class="empty-state-desc">Add a schedule type (e.g. Junior High School) to begin.</p>
          </div>
          <div v-else class="flex flex-wrap gap-2">
            <span v-for="st in scheduleTypes" :key="st.id" class="badge badge-primary">
              <UIcon name="i-heroicons-academic-cap" class="w-3 h-3" />
              {{ st.name }}
            </span>
          </div>
        </div>
      </div>

      <!-- School Years -->
      <div class="card">
        <div class="card-header">
          <p class="card-title">School Years</p>
          <button
            class="btn-primary"
            style="padding: 0.375rem 0.75rem; font-size: 0.8125rem"
            :disabled="!scheduleTypes?.length"
            @click="showYearModal = true"
          >
            <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
            Add Year
          </button>
        </div>
        <div v-if="!schoolYears?.length" class="card-body">
          <div class="empty-state" style="padding: 1.5rem">
            <p class="empty-state-title" style="font-size: 0.875rem">No school years</p>
            <p class="empty-state-desc">Add a school year to configure schedules.</p>
          </div>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
          <NuxtLink
            v-for="year in schoolYears"
            :key="year.id"
            :to="`/schools/${school.id}/school-years/${year.id}`"
            class="block p-4 rounded-lg border transition-all duration-150 cursor-pointer hover:border-[var(--color-primary-muted)] hover:shadow-sm"
            style="border-color: var(--color-border)"
          >
            <div class="flex justify-between items-start mb-2">
              <span class="font-semibold text-[var(--color-ink)]">{{ year.label }}</span>
              <span class="badge" :class="year.isActive ? 'badge-green' : 'badge-gray'">
                {{ year.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <p class="text-xs" style="color: var(--color-muted)">
              {{ scheduleTypes?.find(t => t.id === year.scheduleTypeId)?.name ?? 'Unknown type' }}
            </p>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>

  <!-- Add Schedule Type Modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showTypeModal" class="modal-overlay" @click.self="showTypeModal = false">
        <div class="modal-panel">
          <div class="modal-header">
            <h3 class="modal-title">Add Schedule Type</h3>
            <button @click="showTypeModal = false" style="color: var(--color-muted)">
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>
          <div class="modal-body space-y-3">
            <div>
              <label class="form-label">Type</label>
              <select v-model="newTypeName" class="form-input">
                <option value="">Select a type</option>
                <option v-for="t in TYPE_OPTIONS" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <p class="text-xs" style="color: var(--color-muted)">Year levels and subjects will be seeded automatically.</p>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showTypeModal = false">Cancel</button>
            <button class="btn-primary" :disabled="!newTypeName || saving" @click="addType">
              <UIcon v-if="saving" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              Create
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Add School Year Modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showYearModal" class="modal-overlay" @click.self="showYearModal = false">
        <div class="modal-panel">
          <div class="modal-header">
            <h3 class="modal-title">Add School Year</h3>
            <button @click="showYearModal = false" style="color: var(--color-muted)">
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>
          <div class="modal-body space-y-4">
            <div>
              <label class="form-label">Label</label>
              <input v-model="newYearLabel" class="form-input" placeholder="e.g. 2025-2026" />
            </div>
            <div>
              <label class="form-label">Schedule Type</label>
              <select v-model="newYearTypeId" class="form-input">
                <option :value="null">Select type</option>
                <option v-for="t in scheduleTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showYearModal = false">Cancel</button>
            <button class="btn-primary" :disabled="!newYearLabel || !newYearTypeId || saving" @click="addYear">
              <UIcon v-if="saving" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              Create
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { School, ScheduleType, SchoolYear } from '~/types'

const TYPE_OPTIONS = ['Junior High School']
const route = useRoute()
const schoolId = route.params.id as string

const { data: school, pending } = await useFetch<School>(`/api/schools/${schoolId}`)
const { data: scheduleTypes, refresh: refreshTypes } = await useFetch<ScheduleType[]>('/api/schedule-types', { query: { schoolId } })
const { data: schoolYears, refresh: refreshYears } = await useFetch<SchoolYear[]>('/api/school-years', { query: { schoolId } })

useHead(computed(() => ({ title: school.value?.name ?? 'School' })))

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
