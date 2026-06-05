<template>
  <UCard>
    <template #header>
      <h3 class="font-semibold">Schedule Configuration</h3>
    </template>
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <UFormGroup label="Start of Class">
          <UInput v-model="local.startTime" type="time" />
        </UFormGroup>
        <UFormGroup label="End of Class">
          <UInput v-model="local.endTime" type="time" />
        </UFormGroup>
        <UFormGroup label="Recess Start">
          <UInput v-model="local.recessStart" type="time" />
        </UFormGroup>
        <UFormGroup label="Recess End">
          <UInput v-model="local.recessEnd" type="time" />
        </UFormGroup>
        <UFormGroup label="Lunch Start">
          <UInput v-model="local.lunchStart" type="time" />
        </UFormGroup>
        <UFormGroup label="Lunch End">
          <UInput v-model="local.lunchEnd" type="time" />
        </UFormGroup>
        <UFormGroup label="Slot Duration (mins)" class="col-span-2">
          <USelect
            v-model="local.slotDurationMinutes"
            :options="[
              { label: '30 minutes', value: 30 },
              { label: '45 minutes', value: 45 },
              { label: '60 minutes (1 hour)', value: 60 },
              { label: '90 minutes', value: 90 },
            ]"
          />
        </UFormGroup>
      </div>

      <div class="flex items-center justify-between py-1 border-t border-b">
        <div>
          <p class="text-sm font-medium">Avoid same subject at same time on consecutive days</p>
          <p class="text-xs text-gray-400">e.g. Math at 7am Mon won't be scheduled at 7am Tue</p>
        </div>
        <UToggle v-model="local.avoidConsecutiveSameSubject" />
      </div>

      <!-- Extra Vacant Periods -->
      <div>
        <p class="text-sm font-medium mb-2">Extra Vacant Periods</p>
        <div v-for="(brk, i) in local.extraBreaks" :key="i" class="flex gap-2 items-center mb-2">
          <UInput v-model="brk.label" placeholder="Label (e.g. Aux Time)" class="flex-1" />
          <UInput v-model="brk.startTime" type="time" class="w-28" />
          <span class="text-gray-400 text-sm">to</span>
          <UInput v-model="brk.endTime" type="time" class="w-28" />
          <UButton icon="i-heroicons-x-mark" color="red" variant="ghost" size="xs" @click="local.extraBreaks.splice(i, 1)" />
        </div>
        <UButton
          size="xs"
          variant="soft"
          icon="i-heroicons-plus"
          @click="local.extraBreaks.push({ label: '', startTime: '11:30', endTime: '12:00' })"
        >
          Add Vacant Period
        </UButton>
      </div>

      <UButton block :loading="loading" icon="i-heroicons-sparkles" @click="$emit('generate', { ...local })">
        Generate Schedule
      </UButton>
    </div>
  </UCard>
</template>

<script setup lang="ts">
defineProps<{ loading?: boolean }>()
defineEmits<{ generate: [config: any] }>()

const local = reactive({
  startTime: '07:00',
  endTime: '17:00',
  recessStart: '09:00',
  recessEnd: '09:15',
  lunchStart: '12:00',
  lunchEnd: '13:00',
  slotDurationMinutes: 60,
  avoidConsecutiveSameSubject: true,
  extraBreaks: [] as Array<{ label: string; startTime: string; endTime: string }>,
})
</script>
