<template>
  <div>
    <div class="page-header">
      <div class="breadcrumb mb-2">
        <NuxtLink to="/">Schools</NuxtLink>
        <span class="breadcrumb-sep">/</span>
        <NuxtLink :to="`/schools/${schoolId}`">{{ year?.label ?? '...' }}</NuxtLink>
        <span class="breadcrumb-sep">/</span>
        <span>Dashboard</span>
      </div>
      <h1 class="page-title">{{ year?.label }}</h1>
      <p class="page-sub">School year dashboard — manage teachers and sections</p>
    </div>

    <div class="page-body">
      <!-- Quick stats -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="stat-card">
          <p class="stat-label">Teachers</p>
          <p class="stat-value">{{ teacherCount ?? '—' }}</p>
          <p class="stat-sub">Assigned to this school</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Sections</p>
          <p class="stat-value">{{ sectionCount ?? '—' }}</p>
          <p class="stat-sub">Across all year levels</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Subjects</p>
          <p class="stat-value">{{ subjectCount ?? '—' }}</p>
          <p class="stat-sub">In this schedule type</p>
        </div>
      </div>

      <!-- Navigation cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <NuxtLink
          :to="`/schools/${schoolId}/school-years/${yearId}/teachers`"
          class="card block p-5 hover:border-[var(--color-primary-muted)] transition-colors duration-150 cursor-pointer"
        >
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background: var(--color-primary-light)">
              <UIcon name="i-heroicons-user-group" class="w-5 h-5" style="color: var(--color-primary)" />
            </div>
            <p class="font-semibold text-[var(--color-ink)]">Teachers</p>
          </div>
          <p class="text-sm text-[var(--color-muted)]">Manage teacher profiles, subject assignments, and section counts.</p>
        </NuxtLink>

        <NuxtLink
          :to="`/schools/${schoolId}/school-years/${yearId}/sections`"
          class="card block p-5 hover:border-[var(--color-primary-muted)] transition-colors duration-150 cursor-pointer"
        >
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background: var(--color-primary-light)">
              <UIcon name="i-heroicons-rectangle-stack" class="w-5 h-5" style="color: var(--color-primary)" />
            </div>
            <p class="font-semibold text-[var(--color-ink)]">Sections</p>
          </div>
          <p class="text-sm text-[var(--color-muted)]">Manage class sections, advisers, and generate schedules.</p>
        </NuxtLink>

        <NuxtLink
          :to="`/schools/${schoolId}/school-years/${yearId}/subjects`"
          class="card block p-5 hover:border-[var(--color-primary-muted)] transition-colors duration-150 cursor-pointer"
        >
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background: var(--color-primary-light)">
              <UIcon name="i-heroicons-book-open" class="w-5 h-5" style="color: var(--color-primary)" />
            </div>
            <p class="font-semibold text-[var(--color-ink)]">Subjects</p>
          </div>
          <p class="text-sm text-[var(--color-muted)]">Configure subjects, hours per week, and colors for the scheduler.</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SchoolYear, Teacher, Section, Subject } from '~/types'
const route = useRoute()
const schoolId = route.params.id as string
const yearId = route.params.yearId as string

const { data: year } = await useFetch<SchoolYear>(`/api/school-years/${yearId}`)
const scheduleTypeId = computed(() => year.value?.scheduleTypeId)
const { data: teachers } = await useFetch<Teacher[]>('/api/teachers', { query: { schoolId } })
const { data: sections } = await useFetch<Section[]>('/api/sections', { query: { schoolYearId: yearId } })
const { data: subjects } = await useFetch<Subject[]>('/api/subjects', { query: { scheduleTypeId } })

const teacherCount = computed(() => teachers.value?.length ?? 0)
const sectionCount = computed(() => sections.value?.length ?? 0)
const subjectCount = computed(() => subjects.value?.length ?? 0)
</script>
