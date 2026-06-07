<template>
  <div>
    <div class="page-header">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="page-title">Schools</h1>
          <p class="page-sub">Manage school profiles and their scheduling configurations</p>
        </div>
        <NuxtLink to="/schools/new" class="btn-primary">
          <UIcon name="i-heroicons-plus" class="w-4 h-4" />
          Add School
        </NuxtLink>
      </div>
    </div>

    <div class="page-body">
      <!-- Loading -->
      <div v-if="pending" class="grid gap-3">
        <div v-for="i in 3" :key="i" class="card card-body animate-pulse">
          <div class="h-5 bg-gray-200 rounded w-48 mb-2" />
          <div class="h-4 bg-gray-100 rounded w-64" />
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!schools?.length" class="card">
        <div class="empty-state">
          <UIcon name="i-heroicons-building-library" class="empty-state-icon" />
          <p class="empty-state-title">No schools yet</p>
          <p class="empty-state-desc">Add your first school to begin configuring schedules.</p>
          <NuxtLink to="/schools/new" class="btn-primary mt-4">
            <UIcon name="i-heroicons-plus" class="w-4 h-4" />
            Add School
          </NuxtLink>
        </div>
      </div>

      <!-- School cards -->
      <div v-else class="grid gap-3">
        <NuxtLink
          v-for="school in schools"
          :key="school.id"
          :to="`/schools/${school.id}`"
          class="card block hover:border-[var(--color-primary-muted)] transition-colors duration-150 cursor-pointer"
        >
          <div class="card-body flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style="background: var(--color-primary-light)">
                <UIcon name="i-heroicons-building-library" class="w-5 h-5" style="color: var(--color-primary)" />
              </div>
              <div>
                <p class="font-semibold text-[var(--color-ink)]">{{ school.name }}</p>
                <p v-if="school.address" class="text-sm text-[var(--color-muted)]">{{ school.address }}</p>
                <p v-else class="text-sm text-[var(--color-placeholder)]">No address on file</p>
              </div>
            </div>
            <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 flex-shrink-0" style="color: var(--color-placeholder)" />
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { School } from '~/types'
const { data: schools, pending } = await useFetch<School[]>('/api/schools')
useHead({ title: 'Schools' })
</script>
