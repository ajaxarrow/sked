<template>
  <UContainer class="py-10 max-w-lg">
    <div class="flex items-center gap-3 mb-6">
      <UButton to="/" variant="ghost" icon="i-heroicons-arrow-left" size="sm" />
      <h1 class="text-2xl font-bold">New School</h1>
    </div>
    <UCard>
      <div class="space-y-4">
        <UFormGroup label="School Name" required>
          <UInput v-model="form.name" placeholder="e.g. San Jose National High School" />
        </UFormGroup>
        <UFormGroup label="Address">
          <UInput v-model="form.address" placeholder="Street, City, Province" />
        </UFormGroup>
        <div class="grid grid-cols-2 gap-4">
          <UFormGroup label="Phone">
            <UInput v-model="form.phone" placeholder="+63..." />
          </UFormGroup>
          <UFormGroup label="Email">
            <UInput v-model="form.email" type="email" placeholder="school@deped.gov.ph" />
          </UFormGroup>
        </div>
        <div class="flex gap-3 pt-2">
          <UButton :loading="loading" :disabled="!form.name" @click="submit">Create School</UButton>
          <UButton to="/" variant="ghost" color="gray">Cancel</UButton>
        </div>
        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
      </div>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
const router = useRouter()
const form = reactive({ name: '', address: '', phone: '', email: '' })
const loading = ref(false)
const error = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const school = await $fetch<{ id: number }>('/api/schools', { method: 'POST', body: form })
    await router.push(`/schools/${school.id}`)
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Failed to create school'
  } finally {
    loading.value = false
  }
}
</script>
