<template>
  <NuxtLoadingIndicator color="oklch(0.38 0.13 15)" :height="3" :duration="2500" :throttle="80" />
  <div class="app-shell">
    <!-- Sidebar -->
    <aside class="app-sidebar">
      <!-- Brand -->
      <div class="sidebar-brand">
        <NuxtLink to="/" class="sidebar-brand-logo">
          <div class="sidebar-brand-icon">
            <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-white" />
          </div>
          <div>
            <div class="sidebar-brand-name">Sked</div>
            <div class="sidebar-brand-sub">JHS Scheduler</div>
          </div>
        </NuxtLink>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <NuxtLink to="/" class="sidebar-link" :class="{ active: route.path === '/' }">
          <UIcon name="i-heroicons-building-library" class="icon" />
          Schools
        </NuxtLink>

        <!-- School-level nav (shown when inside a school) -->
        <template v-if="schoolId">
          <div class="sidebar-section-label">{{ school?.name ?? 'School' }}</div>
          <NuxtLink
            :to="`/schools/${schoolId}`"
            class="sidebar-link"
            :class="{ active: route.path === `/schools/${schoolId}` }"
          >
            <UIcon name="i-heroicons-squares-2x2" class="icon" />
            Overview
          </NuxtLink>

          <template v-if="yearId">
            <div class="sidebar-section-label">{{ year?.label ?? 'School Year' }}</div>
            <NuxtLink
              :to="`/schools/${schoolId}/school-years/${yearId}`"
              class="sidebar-link"
              :class="{ active: route.path === `/schools/${schoolId}/school-years/${yearId}` }"
            >
              <UIcon name="i-heroicons-home" class="icon" />
              Dashboard
            </NuxtLink>
            <NuxtLink
              :to="`/schools/${schoolId}/school-years/${yearId}/teachers`"
              class="sidebar-link"
              :class="{ active: route.path.endsWith('/teachers') }"
            >
              <UIcon name="i-heroicons-user-group" class="icon" />
              Teachers
            </NuxtLink>
            <NuxtLink
              :to="`/schools/${schoolId}/school-years/${yearId}/sections`"
              class="sidebar-link"
              :class="{ active: route.path.endsWith('/sections') }"
            >
              <UIcon name="i-heroicons-rectangle-stack" class="icon" />
              Sections
            </NuxtLink>
            <NuxtLink
              :to="`/schools/${schoolId}/school-years/${yearId}/subjects`"
              class="sidebar-link"
              :class="{ active: route.path.endsWith('/subjects') }"
            >
              <UIcon name="i-heroicons-book-open" class="icon" />
              Subjects
            </NuxtLink>
            <NuxtLink
              :to="`/schools/${schoolId}/school-years/${yearId}/schedule`"
              class="sidebar-link"
              :class="{ active: route.path.includes('/schedule') }"
            >
              <UIcon name="i-heroicons-calendar-days" class="icon" />
              Schedule
            </NuxtLink>
          </template>
        </template>
      </nav>

      <!-- Footer -->
      <div class="px-4 py-4 border-t" style="border-color: var(--color-sidebar-border)">
        <p class="text-xs" style="color: var(--color-sidebar-muted)">Academic Scheduling System</p>
      </div>
    </aside>

    <!-- Main content -->
    <main class="app-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import type { School, SchoolYear } from '~/types'

const route = useRoute()

const schoolId = computed(() => route.params.id as string | undefined)
const yearId = computed(() => route.params.yearId as string | undefined)

const { data: school } = useAsyncData(
  'sidebar-school',
  () => schoolId.value ? $fetch<School>(`/api/schools/${schoolId.value}`) : Promise.resolve(null),
  { watch: [schoolId] },
)

const { data: year } = useAsyncData(
  'sidebar-year',
  () => yearId.value ? $fetch<SchoolYear>(`/api/school-years/${yearId.value}`) : Promise.resolve(null),
  { watch: [yearId] },
)
</script>
