<template>
  <UContainer class="py-10">
    <div class="flex items-center gap-3 mb-8">
      <UButton :to="`/schools/${schoolId}`" variant="ghost" icon="i-heroicons-arrow-left" size="sm" />
      <div>
        <h1 class="text-2xl font-bold">{{ year?.label }}</h1>
        <p class="text-sm text-gray-500">School Year Dashboard</p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UCard
        class="cursor-pointer hover:ring-1 ring-primary-400 transition"
        @click="router.push(`/schools/${schoolId}/school-years/${yearId}/sections`)"
      >
        <div class="flex items-start gap-4">
          <UIcon name="i-heroicons-user-group" class="w-8 h-8 text-primary-500 mt-1" />
          <div>
            <p class="text-lg font-semibold">Sections</p>
            <p class="text-sm text-gray-500">Manage class sections and assign advisers</p>
          </div>
        </div>
      </UCard>

      <UCard
        class="cursor-pointer hover:ring-1 ring-primary-400 transition"
        @click="router.push(`/schools/${schoolId}/school-years/${yearId}/teachers`)"
      >
        <div class="flex items-start gap-4">
          <UIcon name="i-heroicons-academic-cap" class="w-8 h-8 text-primary-500 mt-1" />
          <div>
            <p class="text-lg font-semibold">Teachers</p>
            <p class="text-sm text-gray-500">Manage teacher profiles and subject assignments</p>
          </div>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import type { SchoolYear } from '~/types'
const route = useRoute()
const router = useRouter()
const schoolId = parseInt(route.params.id as string)
const yearId = parseInt(route.params.yearId as string)
const { data: year } = await useFetch<SchoolYear>(`/api/school-years/${yearId}`)
</script>
