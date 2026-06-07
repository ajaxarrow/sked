<template>
  <div>
    <div class="page-header">
      <div class="breadcrumb mb-2">
        <NuxtLink to="/">Schools</NuxtLink>
        <span class="breadcrumb-sep">/</span>
        <span>New School</span>
      </div>
      <h1 class="page-title">Add School</h1>
    </div>

    <div class="page-body max-w-xl">
      <div class="card">
        <div class="card-header">
          <p class="card-title">School Information</p>
        </div>
        <div class="card-body space-y-4">
          <div>
            <label class="form-label">School Name <span style="color: var(--color-danger)">*</span></label>
            <input v-model="form.name" class="form-input" placeholder="e.g. San Jose National High School" />
          </div>
          <div>
            <label class="form-label">Address</label>
            <input v-model="form.address" class="form-input" placeholder="Street, City, Province" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="form-label">Phone</label>
              <input v-model="form.phone" class="form-input" placeholder="+63..." />
            </div>
            <div>
              <label class="form-label">Email</label>
              <input v-model="form.email" class="form-input" type="email" placeholder="school@deped.gov.ph" />
            </div>
          </div>
          <p v-if="error" class="text-sm" style="color: var(--color-danger)">{{ error }}</p>
          <div class="flex gap-3 pt-2">
            <button class="btn-primary" :disabled="!form.name || loading" @click="submit">
              <UIcon v-if="loading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              Create School
            </button>
            <NuxtLink to="/" class="btn-ghost">Cancel</NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
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
    const school = await $fetch<{ id: string }>('/api/schools', { method: 'POST', body: form })
    await router.push(`/schools/${school.id}`)
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Failed to create school'
  } finally {
    loading.value = false
  }
}
</script>
