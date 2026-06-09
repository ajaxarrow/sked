<template>
  <div v-if="school">
    <!-- Page header with school avatar -->
    <div class="page-header">
      <div class="breadcrumb mb-3">
        <NuxtLink to="/">Schools</NuxtLink>
        <span class="breadcrumb-sep">/</span>
        <span>{{ school.name }}</span>
      </div>
      <div class="flex items-center gap-4">
        <div class="school-avatar flex-shrink-0">{{ initials(school.name) }}</div>
        <div class="min-w-0">
          <h1 class="page-title">{{ school.name }}</h1>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
            <span v-if="school.address" class="flex items-center gap-1.5 text-sm" style="color:var(--color-muted)">
              <UIcon name="i-heroicons-map-pin" class="w-3.5 h-3.5 flex-shrink-0" />
              {{ school.address }}
            </span>
            <span v-if="school.phone" class="flex items-center gap-1.5 text-sm" style="color:var(--color-muted)">
              <UIcon name="i-heroicons-phone" class="w-3.5 h-3.5 flex-shrink-0" />
              {{ school.phone }}
            </span>
            <span v-if="school.email" class="flex items-center gap-1.5 text-sm" style="color:var(--color-muted)">
              <UIcon name="i-heroicons-envelope" class="w-3.5 h-3.5 flex-shrink-0" />
              {{ school.email }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="page-body space-y-6">
      <!-- School Years -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-base font-semibold" style="color:var(--color-ink)">School Years</h2>
            <p class="text-sm mt-0.5" style="color:var(--color-muted)">
              {{ schoolYears?.length ? `${schoolYears.length} year${schoolYears.length !== 1 ? 's' : ''} configured` : 'No years configured yet' }}
            </p>
          </div>
          <button class="btn-primary" style="padding:0.4375rem 0.875rem; font-size:0.8125rem" @click="openAddYear">
            <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
            Add Year
          </button>
        </div>

        <!-- Empty state -->
        <div v-if="!schoolYears?.length" class="card">
          <div class="empty-state">
            <UIcon name="i-heroicons-calendar-days" class="empty-state-icon" />
            <p class="empty-state-title">No school years yet</p>
            <p class="empty-state-desc">Add a school year to start configuring teachers, sections, and schedules.</p>
            <button class="btn-primary mt-4" @click="openAddYear">
              <UIcon name="i-heroicons-plus" class="w-4 h-4" />
              Add First Year
            </button>
          </div>
        </div>

        <!-- Year cards -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NuxtLink
            v-for="year in schoolYears"
            :key="year.id"
            :to="`/schools/${school.id}/school-years/${year.id}`"
            class="year-card"
          >
            <div class="year-card-label">{{ year.label }}</div>
            <div class="year-card-type flex items-center gap-1.5">
              <UIcon :name="typeIcon(year.scheduleTypeId)" class="w-3.5 h-3.5" />
              {{ typeName(year.scheduleTypeId) }}
            </div>
            <div class="year-card-footer">
              <span class="badge" :class="year.isActive ? 'badge-green' : 'badge-gray'">
                {{ year.isActive ? 'Active' : 'Inactive' }}
              </span>
              <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" style="color:var(--color-border-strong)" />
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>

  <!-- Add School Year Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showYearModal" class="modal-overlay" @click.self="showYearModal = false">
        <div class="modal-panel">
          <div class="modal-header">
            <h3 class="modal-title">Add School Year</h3>
            <button class="modal-close" @click="showYearModal = false">
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>
          <div class="modal-body space-y-5">
            <div>
              <label class="form-label">Level</label>
              <p class="text-xs mb-3" style="color:var(--color-muted)">Subjects and year levels are seeded automatically on first use.</p>
              <div class="grid grid-cols-2 gap-3">
                <button
                  v-for="opt in LEVEL_OPTIONS"
                  :key="opt.value"
                  class="level-option"
                  :class="{ 'level-option-active': form.levelType === opt.value }"
                  @click="form.levelType = opt.value; form.semester = ''"
                >
                  <UIcon :name="opt.icon" class="w-6 h-6 mb-1.5" />
                  <span class="font-semibold text-sm">{{ opt.label }}</span>
                  <span class="text-xs mt-0.5" style="color:var(--color-muted)">{{ opt.sub }}</span>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label">Start Year</label>
                <input
                  v-model.number="form.startYear"
                  class="form-input"
                  type="number"
                  placeholder="2026"
                  min="2000"
                  max="2100"
                  @input="form.endYear = form.startYear + 1"
                />
              </div>
              <div>
                <label class="form-label">End Year</label>
                <input
                  v-model.number="form.endYear"
                  class="form-input"
                  type="number"
                  placeholder="2027"
                  min="2000"
                  max="2100"
                />
              </div>
            </div>

            <div v-if="form.levelType === 'Senior High School'">
              <label class="form-label">Semester</label>
              <div class="grid grid-cols-2 gap-3">
                <button
                  v-for="sem in SEMESTER_OPTIONS"
                  :key="sem"
                  class="level-option"
                  :class="{ 'level-option-active': form.semester === sem }"
                  @click="form.semester = sem"
                >
                  <span class="font-semibold text-sm">{{ sem }}</span>
                </button>
              </div>
            </div>

            <div v-if="previewLabel" class="rounded-lg px-4 py-3" style="background:var(--color-surface); border:1px solid var(--color-border)">
              <p class="text-xs font-medium mb-0.5" style="color:var(--color-muted)">Preview</p>
              <p class="font-semibold" style="color:var(--color-ink)">{{ previewLabel }}</p>
            </div>
          </div>
          <div v-if="error" class="mx-5 mb-1 rounded-lg px-4 py-2.5 text-sm" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca">
            {{ error }}
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showYearModal = false">Cancel</button>
            <button class="btn-primary" :disabled="!canSubmit || saving" @click="addYear">
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

const LEVEL_OPTIONS = [
  { value: 'Junior High School', label: 'Junior High', sub: 'Grades 7–10', icon: 'i-heroicons-academic-cap' },
  { value: 'Senior High School', label: 'Senior High', sub: 'Grades 11–12', icon: 'i-heroicons-building-library' },
]
const SEMESTER_OPTIONS = ['1st Semester', '2nd Semester']

const route = useRoute()
const schoolId = route.params.id as string

const { data: school } = await useFetch<School>(`/api/schools/${schoolId}`)
const { data: scheduleTypes, refresh: refreshTypes } = await useFetch<ScheduleType[]>('/api/schedule-types', { query: { schoolId } })
const { data: schoolYears, refresh: refreshYears } = await useFetch<SchoolYear[]>('/api/school-years', { query: { schoolId } })

useHead(computed(() => ({ title: school.value?.name ?? 'School' })))

const showYearModal = ref(false)
const saving = ref(false)
const error = ref('')
const form = reactive({ levelType: '', startYear: new Date().getFullYear(), endYear: new Date().getFullYear() + 1, semester: '' })

function initials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const previewLabel = computed(() => {
  if (!form.startYear || !form.endYear) return ''
  const base = `${form.startYear}-${form.endYear}`
  return form.semester ? `${base} · ${form.semester}` : base
})

const canSubmit = computed(() => {
  if (!form.levelType || !form.startYear || !form.endYear) return false
  if (form.levelType === 'Senior High School' && !form.semester) return false
  return form.endYear > form.startYear
})

function typeName(scheduleTypeId: number) {
  return scheduleTypes.value?.find(t => t.id === scheduleTypeId)?.name ?? '—'
}
function typeIcon(scheduleTypeId: number) {
  return typeName(scheduleTypeId).includes('Senior') ? 'i-heroicons-building-library' : 'i-heroicons-academic-cap'
}

function openAddYear() {
  form.levelType = ''
  form.startYear = new Date().getFullYear()
  form.endYear = new Date().getFullYear() + 1
  form.semester = ''
  error.value = ''
  showYearModal.value = true
}

async function addYear() {
  saving.value = true
  error.value = ''
  try {
    await $fetch('/api/school-years', {
      method: 'POST',
      body: {
        schoolId,
        levelType: form.levelType,
        startYear: form.startYear,
        endYear: form.endYear,
        semester: form.levelType === 'Senior High School' ? form.semester : null,
      },
    })
    await Promise.all([refreshYears(), refreshTypes()])
    showYearModal.value = false
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Something went wrong.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.level-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0.75rem;
  border-radius: 0.5rem;
  border: 1.5px solid var(--color-border);
  background: white;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  color: var(--color-ink);
}
.level-option:hover { border-color: var(--color-primary-muted); }
.level-option-active { border-color: var(--color-primary); background: var(--color-primary-light); }
</style>
