<template>
  <UContainer class="py-10">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Schools</h1>
      <UButton to="/schools/new" icon="i-heroicons-plus">Add School</UButton>
    </div>
    <div v-if="pending" class="text-gray-400">Loading...</div>
    <div v-else-if="!schools?.length" class="text-center py-20 text-gray-400">
      <p class="text-lg">No schools yet.</p>
      <p class="text-sm mt-1">Click Add School to get started.</p>
    </div>
    <div v-else class="grid gap-4">
      <UCard v-for="school in schools" :key="school.id" class="hover:ring-1 ring-primary-300 transition">
        <div class="flex justify-between items-start">
          <div>
            <p class="font-semibold text-lg">{{ school.name }}</p>
            <p v-if="school.address" class="text-sm text-gray-500">{{ school.address }}</p>
            <p v-if="school.email" class="text-sm text-gray-400">{{ school.email }}</p>
          </div>
          <UButton :to="`/schools/${school.id}`" variant="soft">Manage</UButton>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import type { School } from '~/types'
const { data: schools, pending } = await useFetch<School[]>('/api/schools')
</script>
