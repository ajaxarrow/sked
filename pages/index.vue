<template>
  <div>
    <div class="page-header">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="page-title">Schools</h1>
          <p class="page-sub">
            {{ schools?.length ? `${schools.length} school${schools.length !== 1 ? 's' : ''} configured` : 'Manage school profiles and schedules' }}
          </p>
        </div>
        <button class="btn-primary" @click="showModal = true">
          <UIcon name="i-heroicons-plus" class="w-4 h-4" />
          New School
        </button>
      </div>
    </div>

    <div class="page-body">
      <!-- Skeleton -->
      <div v-if="pending" class="grid gap-3">
        <div v-for="i in 3" :key="i" class="school-card-skeleton" />
      </div>

      <!-- Empty state -->
      <div v-else-if="!schools?.length" class="school-empty">
        <div class="school-empty-icon">
          <UIcon name="i-heroicons-building-library" class="w-8 h-8" />
        </div>
        <p class="school-empty-title">No schools yet</p>
        <p class="school-empty-desc">Create your first school to start configuring schedules for teachers and sections.</p>
        <button class="btn-primary mt-5" @click="showModal = true">
          <UIcon name="i-heroicons-plus" class="w-4 h-4" />
          New School
        </button>
      </div>

      <!-- Schools list -->
      <div v-else class="grid gap-3">
        <NuxtLink
          v-for="school in schools"
          :key="school.id"
          :to="`/schools/${school.id}`"
          class="school-card"
        >
          <div class="school-card-avatar">{{ initials(school.name) }}</div>
          <div class="flex-1 min-w-0">
            <p class="school-card-name">{{ school.name }}</p>
            <p class="school-card-meta">{{ school.address || 'No address on file' }}</p>
          </div>
          <UIcon name="i-heroicons-chevron-right" class="school-card-arrow w-4 h-4" />
        </NuxtLink>
      </div>
    </div>

    <!-- Create School Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-panel">
            <div class="modal-header">
              <h2 class="modal-title">New School</h2>
              <button class="modal-close" @click="closeModal">
                <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
              </button>
            </div>
            <div class="modal-body space-y-4">
              <div>
                <label class="form-label">School Name <span style="color:var(--color-danger)">*</span></label>
                <input
                  ref="nameInput"
                  v-model="form.name"
                  class="form-input"
                  placeholder="e.g. San Jose National High School"
                  @keydown.enter="submit"
                />
              </div>
              <div>
                <label class="form-label">Address</label>
                <input v-model="form.address" class="form-input" placeholder="Street, City, Province" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="form-label">Phone</label>
                  <input v-model="form.phone" class="form-input" placeholder="+63..." />
                </div>
                <div>
                  <label class="form-label">Email</label>
                  <input v-model="form.email" class="form-input" type="email" placeholder="admin@deped.gov.ph" />
                </div>
              </div>
              <p v-if="error" class="text-sm" style="color:var(--color-danger)">{{ error }}</p>
            </div>
            <div class="modal-footer">
              <button class="btn-ghost" @click="closeModal">Cancel</button>
              <button class="btn-primary" :disabled="!form.name.trim() || loading" @click="submit">
                <UIcon v-if="loading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                Create School
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { School } from '~/types'

const router = useRouter()
const { data: schools, pending, refresh } = await useFetch<School[]>('/api/schools')
useHead({ title: 'Schools' })

const showModal = ref(false)
const loading = ref(false)
const error = ref('')
const nameInput = ref<HTMLInputElement | null>(null)
const form = reactive({ name: '', address: '', phone: '', email: '' })

function initials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function closeModal() {
  showModal.value = false
  Object.assign(form, { name: '', address: '', phone: '', email: '' })
  error.value = ''
}

watch(showModal, async (v) => {
  if (v) {
    await nextTick()
    nameInput.value?.focus()
  }
})

async function submit() {
  if (!form.name.trim() || loading.value) return
  loading.value = true
  error.value = ''
  try {
    const school = await $fetch<{ id: string }>('/api/schools', { method: 'POST', body: form })
    await refresh()
    closeModal()
    await router.push(`/schools/${school.id}`)
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Failed to create school.'
  } finally {
    loading.value = false
  }
}
</script>
