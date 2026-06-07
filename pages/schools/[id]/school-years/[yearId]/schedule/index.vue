<template>
  <div>
    <div class="page-header">
      <div class="breadcrumb mb-2">
        <NuxtLink to="/">Schools</NuxtLink>
        <span class="breadcrumb-sep">/</span>
        <NuxtLink :to="`/schools/${schoolId}`">School</NuxtLink>
        <span class="breadcrumb-sep">/</span>
        <NuxtLink :to="`/schools/${schoolId}/school-years/${yearId}`">{{ year?.label }}</NuxtLink>
        <span class="breadcrumb-sep">/</span>
        <span>Schedule</span>
      </div>
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 class="page-title">Schedule</h1>
          <p class="page-sub">{{ year?.label }}</p>
        </div>
        <button class="btn-primary" @click="openGenerateModal">
          <UIcon name="i-heroicons-sparkles" class="w-4 h-4" />
          Generate New Schedule
        </button>
      </div>
    </div>

    <div class="page-body">

      <!-- No schedules yet -->
      <div v-if="!scheduleSets?.length" class="card">
        <div class="empty-state" style="padding: 5rem 2rem">
          <UIcon name="i-heroicons-calendar-days" class="empty-state-icon" style="width: 4rem; height: 4rem" />
          <p class="empty-state-title">No schedule yet</p>
          <p class="empty-state-desc">Generate your first schedule to see the master timetable.</p>
          <button class="btn-primary mt-4" @click="openGenerateModal">
            <UIcon name="i-heroicons-sparkles" class="w-4 h-4" />
            Generate Schedule
          </button>
        </div>
      </div>

      <!-- Schedule viewer -->
      <template v-else>
        <!-- Set selector bar -->
        <div class="flex items-center gap-3 mb-4 flex-wrap">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <label class="text-sm font-medium flex-shrink-0" style="color: var(--color-muted)">Schedule:</label>
            <select
              v-model="activeSetId"
              class="form-input flex-1"
              style="max-width: 360px; padding: 0.375rem 0.75rem; font-size: 0.875rem"
            >
              <option v-for="set in scheduleSets" :key="set.id" :value="set.id">
                {{ set.name }} ({{ formatDate(set.createdAt) }})
              </option>
            </select>
          </div>
          <button
            v-if="activeView !== 'load'"
            class="btn-ghost"
            style="padding: 0.375rem 0.75rem; font-size: 0.8125rem"
            title="Regenerate this schedule"
            @click="openRegenerateModal"
          >
            <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5" />
            Regenerate
          </button>
          <!-- Export: dropdown for All Sections tab, simple button otherwise -->
          <div v-if="activeView === 'master'" ref="exportMenuRef" style="position:relative">
            <button
              class="btn-ghost"
              style="padding: 0.375rem 0.75rem; font-size: 0.8125rem; display:flex; align-items:center; gap:0.25rem"
              title="Export schedule as .doc"
              @click="showExportMenu = !showExportMenu"
            >
              <UIcon name="i-heroicons-arrow-down-tray" class="w-3.5 h-3.5" />
              Export
              <UIcon name="i-heroicons-chevron-down" class="w-3 h-3" style="opacity:0.7" />
            </button>
            <div
              v-if="showExportMenu"
              style="position:absolute; top:calc(100% + 4px); right:0; background:var(--color-surface); border:1px solid var(--color-border); border-radius:0.5rem; box-shadow:0 4px 16px rgba(0,0,0,0.12); min-width:220px; z-index:50; overflow:hidden"
            >
              <button
                class="export-menu-item"
                @click="doExport('master')"
              >
                <UIcon name="i-heroicons-table-cells" class="w-4 h-4" />
                Full Schedule (all sections)
              </button>
              <button
                class="export-menu-item"
                @click="doExport('sections')"
              >
                <UIcon name="i-heroicons-document-text" class="w-4 h-4" />
                By Section (individual pages)
              </button>
              <button
                class="export-menu-item"
                @click="doExport('teachers')"
              >
                <UIcon name="i-heroicons-user-group" class="w-4 h-4" />
                By Teacher (individual pages)
              </button>
              <button
                class="export-menu-item"
                @click="doExport('load-doc')"
              >
                <UIcon name="i-heroicons-chart-bar" class="w-4 h-4" />
                Teaching Load
              </button>
            </div>
          </div>
          <button
            v-else
            class="btn-ghost"
            style="padding: 0.375rem 0.75rem; font-size: 0.8125rem"
            :title="exportLabel"
            @click="doExport('simple')"
          >
            <UIcon name="i-heroicons-arrow-down-tray" class="w-3.5 h-3.5" />
            Export
          </button>
          <button
            class="btn-danger"
            style="padding: 0.375rem 0.75rem; font-size: 0.8125rem"
            @click="deleteActiveSet"
          >
            <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
            Delete
          </button>
        </div>

        <!-- View tabs -->
        <div class="flex items-center border-b mb-4" style="border-color: var(--color-border); justify-content: space-between">
          <div class="flex">
            <button
              v-for="tab in viewTabs"
              :key="tab.id"
              class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
              :class="activeView === tab.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'"
              style="margin-bottom: -1px"
              @click="switchTab(tab.id as 'master' | 'section' | 'teacher')"
            >
              {{ tab.label }}
            </button>
          </div>
          <div class="flex items-center gap-1.5 pb-2" v-if="activeView !== 'load'">
            <span class="text-xs" style="color: var(--color-muted)">Color by:</span>
            <div class="color-by-toggle">
              <button :class="{ active: colorBy === 'subject' }" @click="colorBy = 'subject'">Subject</button>
              <button :class="{ active: colorBy === 'teacher' }" @click="colorBy = 'teacher'">Teacher</button>
            </div>
          </div>
        </div>

        <!-- Master grid view -->
        <template v-if="activeView === 'master'">
          <div v-if="!loadingMaster && masterSchedule?.entries?.length" class="swap-hint-bar mb-3">
            <UIcon name="i-heroicons-arrows-right-left" class="w-3.5 h-3.5 flex-shrink-0" />
            <span>Click any subject cell to find conflict-free swap options for that section.</span>
          </div>
          <div v-if="loadingMaster" class="card">
            <div class="empty-state" style="padding: 3rem">
              <UIcon name="i-heroicons-arrow-path" class="empty-state-icon animate-spin" style="width: 2rem; height: 2rem" />
              <p class="empty-state-title">Loading schedule...</p>
            </div>
          </div>
          <div v-else-if="!masterSchedule?.entries?.length" class="card">
            <div class="empty-state" style="padding: 4rem 2rem">
              <UIcon name="i-heroicons-calendar-days" class="empty-state-icon" />
              <p class="empty-state-title">No entries in this schedule</p>
            </div>
          </div>
          <ScheduleMasterScheduleGrid
            v-else
            :sections="masterSchedule.sections"
            :entries="masterSchedule.entries"
            :selected-day="swapSource?.dayOfWeek ?? null"
            :selected-time="swapSource?.slotStartTime ?? null"
            :selected-section="swapSource?.sectionId ?? null"
            :color-by="colorBy"
            @cell-click="onCellClick"
          />
        </template>

        <!-- By section view -->
        <template v-else-if="activeView === 'section'">
          <div class="flex items-center gap-3 mb-4">
            <label class="text-sm font-medium flex-shrink-0" style="color: var(--color-muted)">Section:</label>
            <select
              v-model="activeSectionId"
              class="form-input"
              style="max-width: 280px; padding: 0.375rem 0.75rem; font-size: 0.875rem"
            >
              <option v-for="sec in sections" :key="sec.id" :value="sec.id">
                {{ sec.name }} — {{ sec.yearLevelName }}
              </option>
            </select>
          </div>
          <!-- Swap hint banner -->
          <div v-if="!loadingSection && sectionSchedule?.entries?.length" class="swap-hint-bar mb-3">
            <UIcon name="i-heroicons-arrows-right-left" class="w-3.5 h-3.5 flex-shrink-0" />
            <span>Click any subject cell to find conflict-free swap options for this section.</span>
          </div>

          <div v-if="loadingSection" class="card">
            <div class="empty-state" style="padding: 3rem">
              <UIcon name="i-heroicons-arrow-path" class="empty-state-icon animate-spin" style="width: 2rem; height: 2rem" />
              <p class="empty-state-title">Loading section schedule...</p>
            </div>
          </div>
          <div v-else-if="!sectionSchedule?.entries?.length" class="card">
            <div class="empty-state" style="padding: 4rem 2rem">
              <UIcon name="i-heroicons-calendar-days" class="empty-state-icon" />
              <p class="empty-state-title">No entries for this section</p>
            </div>
          </div>
          <ScheduleGrid
            v-else
            :entries="sectionSchedule.entries"
            :slot-vacancies="sectionSchedule.slotVacancies ?? {}"
            :selected-day="swapSource?.dayOfWeek ?? null"
            :selected-time="swapSource?.slotStartTime ?? null"
            :color-by="colorBy"
            @cell-click="onCellClick"
          />

        </template>

        <!-- By teacher view -->
        <template v-else-if="activeView === 'teacher'">
          <div class="flex items-center gap-3 mb-4">
            <label class="text-sm font-medium flex-shrink-0" style="color: var(--color-muted)">Teacher:</label>
            <select
              v-model="activeTeacherId"
              class="form-input"
              style="max-width: 280px; padding: 0.375rem 0.75rem; font-size: 0.875rem"
            >
              <option v-for="t in teachersInSchedule" :key="t.id" :value="t.id">
                {{ t.name }}
              </option>
            </select>
          </div>
          <div v-if="!loadingTeacher && teacherSchedule?.teacher" class="swap-hint-bar mb-3">
            <UIcon name="i-heroicons-arrows-right-left" class="w-3.5 h-3.5 flex-shrink-0" />
            <span>Click any subject cell to find conflict-free swap options for that section.</span>
          </div>
          <div v-if="loadingTeacher" class="card">
            <div class="empty-state" style="padding: 3rem">
              <UIcon name="i-heroicons-arrow-path" class="empty-state-icon animate-spin" style="width: 2rem; height: 2rem" />
              <p class="empty-state-title">Loading teacher schedule...</p>
            </div>
          </div>
          <div v-else-if="!teachersInSchedule.length" class="card">
            <div class="empty-state" style="padding: 4rem 2rem">
              <UIcon name="i-heroicons-user-group" class="empty-state-icon" />
              <p class="empty-state-title">No teachers in this schedule</p>
            </div>
          </div>
          <ScheduleTeacherScheduleGrid
            v-else-if="teacherSchedule?.teacher"
            :teacher="teacherSchedule.teacher"
            :teaching-entries="teacherSchedule.teachingEntries"
            :special-slots="teacherSchedule.specialSlots"
            :all-slot-times="teacherSchedule.allSlotTimes"
            :selected-day="swapSource?.dayOfWeek ?? null"
            :selected-time="swapSource?.slotStartTime ?? null"
            :selected-section="swapSource?.sectionId ?? null"
            :color-by="colorBy"
            @cell-click="onCellClick"
          />
        </template>

        <!-- Teaching Load view -->
        <template v-else-if="activeView === 'load'">
          <div v-if="loadingMaster" class="card">
            <div class="empty-state" style="padding: 3rem">
              <UIcon name="i-heroicons-arrow-path" class="empty-state-icon animate-spin" style="width: 2rem; height: 2rem" />
              <p class="empty-state-title">Loading schedule...</p>
            </div>
          </div>
          <div v-else-if="!teachingLoad.length" class="card">
            <div class="empty-state" style="padding: 4rem 2rem">
              <UIcon name="i-heroicons-user-group" class="empty-state-icon" />
              <p class="empty-state-title">No schedule data</p>
              <p class="empty-state-desc">Generate a schedule first to view the teaching load.</p>
            </div>
          </div>
          <div v-else class="card overflow-hidden">
            <div class="overflow-x-auto">
              <table class="schedule-table" style="min-width: 700px">
                <thead>
                  <tr>
                    <th style="text-align:left; width: 14rem">Teacher</th>
                    <th style="text-align:left">Subjects Assigned</th>
                    <th style="width: 9rem; text-align:center">Hours / Week</th>
                    <th style="width: 9rem; text-align:center">Daily Avg</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in teachingLoad" :key="row.teacherId">
                    <td style="font-weight:700; vertical-align:top; padding-top:0.625rem">
                      {{ row.teacherName }}
                    </td>
                    <td style="vertical-align:top; padding: 0.375rem 0.75rem">
                      <div class="flex flex-wrap gap-1.5">
                        <div
                          v-for="subj in row.subjects"
                          :key="subj.subjectName"
                          class="load-subject-chip"
                          :style="{ background: (subj.subjectColor || '#6366f1') + '22', color: subj.subjectColor || '#6366f1' }"
                        >
                          <span class="font-semibold">{{ subj.subjectName }}</span>
                          <span class="load-chip-meta">{{ subj.sectionNames.join(', ') }}</span>
                          <span class="load-chip-hrs">{{ fmtHM(subj.minutesPerWeek) }}</span>
                        </div>
                      </div>
                    </td>
                    <td style="text-align:center; font-weight:700; vertical-align:top; padding-top:0.625rem; font-size:0.9375rem">
                      {{ fmtHM(row.totalMinutesPerWeek) }}
                    </td>
                    <td style="text-align:center; vertical-align:top; padding-top:0.625rem" :style="{ color: 'var(--color-muted)' }">
                      {{ fmtHM(Math.round(row.totalMinutesPerWeek / 5)) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </template>
    </div>

    <!-- Swap modal -->
    <Teleport to="body">
      <Transition name="swap-modal">
        <div v-if="swapSource" class="swap-modal-backdrop" @click.self="clearSwap">
          <div class="swap-modal-box" role="dialog" aria-modal="true" aria-label="Find Swaps">

            <!-- Header -->
            <div class="swap-modal-header">
              <div class="swap-modal-title-row">
                <UIcon name="i-heroicons-arrows-right-left" class="w-4 h-4" style="color: var(--color-primary)" />
                <span class="swap-modal-title">Find Swaps</span>
              </div>
              <div class="swap-modal-source">
                <span
                  class="swap-chip"
                  :style="{ background: (swapSource.subjectColor || '#6366f1') + '22', color: swapSource.subjectColor || '#6366f1' }"
                >{{ swapSource.subjectName }}</span>
                <span class="swap-modal-meta">
                  {{ DAY_NAMES[swapSource.dayOfWeek] }} {{ fmtSwapTime(swapSource.slotStartTime) }}
                  &bull; {{ swapSource.teacherName }}
                </span>
                <span v-if="swapSourceSection" class="swap-section-badge">
                  {{ swapSourceSection.yearLevelName }} – {{ swapSourceSection.name }}
                </span>
              </div>
              <button class="swap-modal-close" aria-label="Close" @click="clearSwap">
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
              </button>
            </div>

            <!-- Body -->
            <div class="swap-modal-body">
              <div v-if="swapLoading" class="swap-modal-status">
                <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                Finding available swaps…
              </div>
              <div v-else-if="swapError" class="swap-modal-status swap-modal-status--error">{{ swapError }}</div>

              <template v-else-if="swapResults">
                <!-- 2-way swaps -->
                <div class="swap-section">
                  <p class="swap-section-label">
                    2-Way Swaps
                    <span class="swap-section-hint">— direct exchange</span>
                  </p>
                  <div v-if="!swapResults.twoWaySwaps.length" class="swap-empty">No direct swaps available.</div>
                  <div v-else class="swap-list">
                    <div v-for="(sw, i) in swapResults.twoWaySwaps" :key="i" class="swap-row">
                      <span
                        class="swap-chip"
                        :style="{ background: (sw.target.subjectColor || '#6366f1') + '22', color: sw.target.subjectColor || '#6366f1' }"
                      >{{ sw.target.subjectName }}</span>
                      <span class="swap-row-meta">{{ DAY_NAMES[sw.target.dayOfWeek] }} {{ fmtSwapTime(sw.target.slotStartTime) }}</span>
                      <span class="swap-row-teacher">{{ sw.target.teacherName }}</span>
                      <span v-if="sw.sameTeacher" class="swap-tag swap-tag--same">same teacher</span>
                      <button
                        class="btn-primary swap-exec-btn"
                        :disabled="swapExecuting"
                        @click="executeSwap('2way', [{ dayOfWeek: swapSource!.dayOfWeek, slotStartTime: swapSource!.slotStartTime }, { dayOfWeek: sw.target.dayOfWeek, slotStartTime: sw.target.slotStartTime }])"
                      >Swap</button>
                    </div>
                  </div>
                </div>

                <!-- 3-way swaps -->
                <div class="swap-section">
                  <p class="swap-section-label">
                    3-Way Swaps
                    <span class="swap-section-hint">— 3-slot rotation</span>
                  </p>
                  <div v-if="!swapResults.threeWaySwaps.length" class="swap-empty">No 3-way rotations available.</div>
                  <div v-else class="swap-list">
                    <div v-for="(sw, i) in swapResults.threeWaySwaps" :key="i" class="swap-row swap-row--3way">
                      <!-- Rotation slots stacked vertically -->
                      <div class="swap-rotation">
                        <!-- Slot A: source moves to B's time -->
                        <div class="swap-rotation-slot">
                          <span
                            class="swap-chip"
                            :style="{ background: (swapSource!.subjectColor || '#6366f1') + '22', color: swapSource!.subjectColor || '#6366f1' }"
                          >{{ swapSource!.subjectName }}</span>
                          <span class="swap-rotation-teacher">{{ swapSource!.teacherName }}</span>
                          <span class="swap-rotation-time">{{ DAY_NAMES[swapSource!.dayOfWeek] }} {{ fmtSwapTime(swapSource!.slotStartTime) }}</span>
                          <span class="swap-rotation-arrow">→ {{ DAY_NAMES[sw.target.dayOfWeek] }} {{ fmtSwapTime(sw.target.slotStartTime) }}</span>
                        </div>
                        <!-- Slot B: through moves to C's time -->
                        <div class="swap-rotation-slot">
                          <span
                            class="swap-chip"
                            :style="{ background: (sw.through.subjectColor || '#6366f1') + '22', color: sw.through.subjectColor || '#6366f1' }"
                          >{{ sw.through.subjectName }}</span>
                          <span class="swap-rotation-teacher">{{ sw.through.teacherName }}</span>
                          <span class="swap-rotation-time">{{ DAY_NAMES[sw.through.dayOfWeek] }} {{ fmtSwapTime(sw.through.slotStartTime) }}</span>
                          <span class="swap-rotation-arrow">→ {{ DAY_NAMES[sw.displaced.dayOfWeek] }} {{ fmtSwapTime(sw.displaced.slotStartTime) }}</span>
                        </div>
                        <!-- Slot C: displaced moves to source's original time -->
                        <div class="swap-rotation-slot">
                          <span
                            class="swap-chip"
                            :style="{ background: (sw.displaced.subjectColor || '#6366f1') + '22', color: sw.displaced.subjectColor || '#6366f1' }"
                          >{{ sw.displaced.subjectName }}</span>
                          <span class="swap-rotation-teacher">{{ sw.displaced.teacherName }}</span>
                          <span class="swap-rotation-time">{{ DAY_NAMES[sw.displaced.dayOfWeek] }} {{ fmtSwapTime(sw.displaced.slotStartTime) }}</span>
                          <span class="swap-rotation-arrow">→ {{ DAY_NAMES[swapSource!.dayOfWeek] }} {{ fmtSwapTime(swapSource!.slotStartTime) }}</span>
                        </div>
                      </div>
                      <button
                        class="btn-primary swap-exec-btn"
                        :disabled="swapExecuting"
                        @click="executeSwap('3way', [
                          { dayOfWeek: swapSource!.dayOfWeek, slotStartTime: swapSource!.slotStartTime },
                          { dayOfWeek: sw.through.dayOfWeek, slotStartTime: sw.through.slotStartTime },
                          { dayOfWeek: sw.displaced.dayOfWeek, slotStartTime: sw.displaced.slotStartTime },
                        ])"
                      >Swap</button>
                    </div>
                  </div>
                </div>
              </template>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Generate modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showGenerateModal" class="modal-overlay" @click.self="showGenerateModal = false">
          <div class="modal-panel" style="max-width: 38rem; max-height: 90vh; overflow-y: auto">
            <div class="modal-header">
              <h3 class="modal-title">{{ genMode === 'overwrite' ? 'Regenerate Schedule' : 'Generate New Schedule' }}</h3>
              <button @click="showGenerateModal = false" style="color: var(--color-muted)">
                <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
              </button>
            </div>
            <div class="modal-body space-y-5">
              <!-- Name (new only) / Overwrite notice -->
              <div v-if="genMode === 'new'">
                <label class="form-label">Schedule Name <span style="color: var(--color-danger)">*</span></label>
                <input v-model="genName" class="form-input" placeholder="e.g. Draft 1, Final, SY 2026-2027" />
              </div>
              <div v-else class="rounded-lg px-4 py-3 text-sm" style="background: oklch(0.97 0.02 60); border: 1px solid oklch(0.88 0.06 60); color: oklch(0.45 0.08 60)">
                <p class="font-semibold mb-0.5">Overwriting: {{ activeSet?.name }}</p>
                <p class="text-xs" style="opacity: 0.8">All existing entries for the selected sections will be replaced with the new schedule.</p>
              </div>

              <!-- Sections -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="form-label" style="margin: 0">Sections to include</label>
                  <button
                    class="text-xs"
                    style="color: var(--color-muted); text-decoration: underline"
                    @click="toggleAllGenSections"
                  >
                    {{ genSectionIds.length === (sections?.length ?? 0) ? 'Deselect all' : 'Select all' }}
                  </button>
                </div>
                <div class="rounded-lg overflow-hidden" style="border: 1px solid var(--color-border)">
                  <label
                    v-for="sec in sections"
                    :key="sec.id"
                    class="flex items-center gap-2.5 px-3 py-2 cursor-pointer transition hover:bg-[var(--color-surface)]"
                    style="border-bottom: 1px solid var(--color-border)"
                  >
                    <input
                      type="checkbox"
                      :value="sec.id"
                      v-model="genSectionIds"
                      style="accent-color: var(--color-primary); width: 1rem; height: 1rem; flex-shrink: 0"
                    />
                    <div>
                      <p class="text-sm font-medium" style="color: var(--color-ink)">{{ sec.name }}</p>
                      <p class="text-xs" style="color: var(--color-muted)">{{ sec.yearLevelName }}</p>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Params form — its Generate button submits the whole modal -->
              <ScheduleGenerateParamsForm
                :loading="generating"
                :inline="true"
                :initial-config="lastConfig"
                @generate="triggerGenerate"
              />
            </div>
            <div class="modal-footer">
              <button class="btn-ghost" @click="showGenerateModal = false">Cancel</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Section, SchoolYear, ScheduleSet, ScheduleEntry, School } from '~/types'

const route = useRoute()
const schoolId = route.params.id as string
const yearId = route.params.yearId as string

const { data: school } = await useFetch<School>(`/api/schools/${schoolId}`)
const { data: year } = await useFetch<SchoolYear>(`/api/school-years/${yearId}`)

useHead(computed(() => ({ title: year.value?.name ? `Schedule · ${year.value.name}` : 'Schedule' })))
const { data: sections } = await useFetch<Section[]>('/api/sections', { query: { schoolYearId: yearId } })
const { data: scheduleSets, refresh: refreshSets } = await useFetch<ScheduleSet[]>(
  '/api/schedule-sets',
  { query: { schoolYearId: yearId } },
)

const activeSetId = ref<string | null>(null)
const activeView = ref<'master' | 'section' | 'teacher' | 'load'>('master')
const colorBy = ref<'subject' | 'teacher'>('teacher')
const activeSectionId = ref<string | null>(null)
const activeTeacherId = ref<string | null>(null)
const generating = ref(false)
const showGenerateModal = ref(false)
const genName = ref('')
const genSectionIds = ref<string[]>([])
const genMode = ref<'new' | 'overwrite'>('new')
const lastConfig = ref<any>(null)
const shortfallWarning = ref<Array<{ sectionName: string; subject: string; needed: number; assigned: number }>>([])
const showShortfall = ref(false)

const activeSet = computed(() => scheduleSets.value?.find(s => s.id === activeSetId.value))

// ── Export ──────────────────────────────────────────────────────────────────
const {
  exportMasterSchedule,
  exportAllSectionsDoc,
  exportAllTeachersDoc,
  exportSectionSchedule,
  exportTeacherSchedule,
  exportTeachingLoad,
} = useScheduleExport()

const showExportMenu = ref(false)
const exportMenuRef  = ref<HTMLElement | null>(null)

function handleDocClick(e: MouseEvent) {
  if (exportMenuRef.value && !exportMenuRef.value.contains(e.target as Node)) {
    showExportMenu.value = false
  }
}
function handleDocKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && swapSource.value) clearSwap()
}
onMounted(() => {
  document.addEventListener('click', handleDocClick, true)
  document.addEventListener('keydown', handleDocKeydown)
})
onUnmounted(() => {
  document.removeEventListener('click', handleDocClick, true)
  document.removeEventListener('keydown', handleDocKeydown)
})

const exportLabel = computed(() => {
  if (activeView.value === 'section') {
    const sec = sections.value?.find(s => s.id === activeSectionId.value)
    return `Export ${sec?.name ?? 'section'} as .doc`
  }
  if (activeView.value === 'teacher') {
    const t = teachersInSchedule.value.find(t => t.id === activeTeacherId.value)
    return `Export ${t?.name ?? 'teacher'} schedule as .doc`
  }
  return 'Export schedule as .doc'
})

function doExport(kind: 'master' | 'sections' | 'teachers' | 'load-doc' | 'simple') {
  showExportMenu.value = false
  const base = {
    schoolName:      school.value?.name ?? 'School',
    yearLabel:       year.value?.label ?? '',
    scheduleSetName: activeSet.value?.name ?? '',
  }
  const masterBase = { ...base, sections: masterSchedule.value?.sections ?? [], entries: masterSchedule.value?.entries ?? [], colorBy: colorBy.value }

  if (kind === 'master' || (kind === 'simple' && activeView.value === 'master')) {
    if (masterBase.entries.length) exportMasterSchedule(masterBase)
    return
  }
  if (kind === 'sections') {
    if (masterBase.entries.length) exportAllSectionsDoc(masterBase)
    return
  }
  if (kind === 'teachers') {
    if (masterBase.entries.length) exportAllTeachersDoc(masterBase)
    return
  }
  if (kind === 'load-doc') {
    if (teachingLoad.value.length) exportTeachingLoad({ ...base, rows: teachingLoad.value })
    return
  }

  // kind === 'simple' for By Section, By Teacher, or Teaching Load tabs
  if (activeView.value === 'load') {
    if (teachingLoad.value.length) exportTeachingLoad({ ...base, rows: teachingLoad.value })
    return
  }
  if (activeView.value === 'section' && sectionSchedule.value?.entries?.length) {
    const sec = sections.value?.find(s => s.id === activeSectionId.value)
    exportSectionSchedule({ ...base, sectionName: sec?.name ?? 'Section', entries: sectionSchedule.value.entries, colorBy: colorBy.value })
    return
  }
  if (activeView.value === 'teacher' && teacherSchedule.value?.teacher) {
    exportTeacherSchedule({
      ...base,
      teacherName:     teacherSchedule.value.teacher.name,
      teacherId:       teacherSchedule.value.teacher.id,
      teachingEntries: teacherSchedule.value.teachingEntries ?? [],
      specialSlots:    teacherSchedule.value.specialSlots ?? [],
      allSlotTimes:    teacherSchedule.value.allSlotTimes ?? [],
      colorBy:         colorBy.value,
    })
  }
}
// ── End Export ──────────────────────────────────────────────────────────────

const viewTabs = [
  { id: 'master',  label: 'All Sections' },
  { id: 'section', label: 'By Section' },
  { id: 'teacher', label: 'By Teacher' },
  { id: 'load',    label: 'Teaching Load' },
]

watch(sections, (secs) => {
  if (secs?.length) {
    if (!activeSectionId.value) activeSectionId.value = secs[0].id
    if (!genSectionIds.value.length) genSectionIds.value = secs.map(s => s.id)
  }
}, { immediate: true })

watch(scheduleSets, (sets) => {
  if (sets?.length && !activeSetId.value) activeSetId.value = sets[0].id
}, { immediate: true })

// Master schedule data — declared BEFORE teachersInSchedule to avoid TDZ
const { data: masterSchedule, pending: loadingMaster, refresh: refreshMaster } = useAsyncData(
  'master-schedule',
  () => activeSetId.value
    ? $fetch<{ sections: any[]; entries: ScheduleEntry[]; scheduleSetId: string | null }>('/api/schedules/all', {
        query: { schoolYearId: yearId, scheduleSetId: activeSetId.value },
      })
    : Promise.resolve({ sections: [], entries: [], scheduleSetId: null }),
  { watch: [activeSetId], default: () => ({ sections: [], entries: [], scheduleSetId: null }) },
)

const teachersInSchedule = computed(() => {
  const seen = new Map<string, { id: string; name: string }>()
  for (const e of masterSchedule.value?.entries ?? []) {
    if (e.teacherId && (e as any).teacherName && !seen.has(e.teacherId)) {
      seen.set(e.teacherId, { id: e.teacherId, name: (e as any).teacherName })
    }
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
})

// ── Teaching Load ────────────────────────────────────────────────────────────

function fmtHM(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

interface LoadSubject {
  subjectId: number | null
  subjectName: string
  subjectColor: string
  sectionNames: string[]
  minutesPerWeek: number
}

interface LoadRow {
  teacherId: string
  teacherName: string
  subjects: LoadSubject[]
  totalMinutesPerWeek: number
}

const teachingLoad = computed((): LoadRow[] => {
  const entries = masterSchedule.value?.entries ?? []
  const secs    = masterSchedule.value?.sections ?? []
  if (!entries.length) return []

  const secName = new Map(secs.map((s: any) => [s.id as string, s.name as string]))
  const byTeacher = new Map<string, LoadRow>()

  for (const e of entries) {
    if (!e.teacherId || !e.teacherName || e.specialLabel) continue

    if (!byTeacher.has(e.teacherId)) {
      byTeacher.set(e.teacherId, {
        teacherId:           e.teacherId,
        teacherName:         e.teacherName,
        subjects:            [],
        totalMinutesPerWeek: 0,
      })
    }
    const row = byTeacher.get(e.teacherId)!

    const [sh = 0, sm = 0] = e.slotStartTime.split(':').map(Number)
    const [eh = 0, em = 0] = e.slotEndTime.split(':').map(Number)
    const dur = (eh * 60 + em) - (sh * 60 + sm)
    row.totalMinutesPerWeek += dur

    let subj = row.subjects.find(s => s.subjectId === e.subjectId)
    if (!subj) {
      subj = {
        subjectId:      e.subjectId,
        subjectName:    e.subjectName ?? '',
        subjectColor:   e.subjectColor ?? '#6366f1',
        sectionNames:   [],
        minutesPerWeek: 0,
      }
      row.subjects.push(subj)
    }
    subj.minutesPerWeek += dur
    const sn = secName.get(e.sectionId)
    if (sn && !subj.sectionNames.includes(sn)) subj.sectionNames.push(sn)
  }

  return [...byTeacher.values()].sort((a, b) => a.teacherName.localeCompare(b.teacherName))
})

// ── Swap ─────────────────────────────────────────────────────────────────────

const DAY_NAMES: Record<number, string> = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri' }

function fmtSwapTime(t: string): string {
  const [h = 0, m = 0] = t.split(':').map(Number)
  const ampm = h < 12 ? 'AM' : 'PM'
  const hh   = h % 12 || 12
  return m === 0 ? `${hh}${ampm}` : `${hh}:${String(m).padStart(2, '0')}${ampm}`
}

interface SwapSlot { dayOfWeek: number; slotStartTime: string }
interface SwapEntry {
  sectionId: string | null
  dayOfWeek: number; slotStartTime: string; slotEndTime: string
  subjectName: string | null; subjectColor: string | null
  teacherName: string | null; teacherId: string | null
}
interface SwapResults {
  source: SwapEntry
  twoWaySwaps: Array<{ type: '2way'; target: SwapEntry; sameTeacher: boolean }>
  threeWaySwaps: Array<{ type: '3way'; target: SwapEntry; through: SwapEntry; displaced: SwapEntry }>
}

const swapSource   = ref<SwapEntry | null>(null)
const swapResults  = ref<SwapResults | null>(null)
const swapLoading  = ref(false)
const swapError    = ref<string | null>(null)
const swapExecuting = ref(false)

const swapSourceSection = computed(() =>
  sections.value?.find(s => s.id === swapSource.value?.sectionId) ?? null
)

function clearSwap() {
  swapSource.value  = null
  swapResults.value = null
  swapError.value   = null
}

// Clear swap when switching sections or schedule sets
watch([activeSectionId, activeSetId], clearSwap)

async function onCellClick(entry: any) {
  if (!entry || entry.specialLabel) return
  swapSource.value  = entry as SwapEntry
  swapResults.value = null
  swapError.value   = null
  swapLoading.value = true

  try {
    swapResults.value = await $fetch<SwapResults>('/api/schedules/swaps', {
      method: 'POST',
      body: {
        scheduleSetId:       activeSetId.value,
        sectionId:           entry.sectionId ?? activeSectionId.value,
        sourceDayOfWeek:     entry.dayOfWeek,
        sourceSlotStartTime: entry.slotStartTime,
      },
    })
  } catch (e: any) {
    swapError.value = e?.data?.message ?? e?.message ?? 'Failed to find swaps.'
  } finally {
    swapLoading.value = false
  }
}

async function executeSwap(type: '2way' | '3way', slots: SwapSlot[]) {
  const sectionId = swapSource.value?.sectionId ?? activeSectionId.value
  if (!activeSetId.value || !sectionId || swapExecuting.value) return
  swapExecuting.value = true
  try {
    await $fetch('/api/schedules/swap-execute', {
      method: 'POST',
      body: { scheduleSetId: activeSetId.value, sectionId, type, slots },
    })
    clearSwap()
    // Refresh whichever view is active
    if (activeView.value === 'master') await refreshMaster()
    else if (activeView.value === 'teacher') await refreshTeacher()
    else await refreshSection()
  } catch (e: any) {
    alert(e?.data?.message ?? e?.message ?? 'Swap failed. Please try again.')
  } finally {
    swapExecuting.value = false
  }
}

watch(activeSetId, () => {
  if (!sections.value?.length) return
  if (!activeSectionId.value || !sections.value.some((sec) => sec.id === activeSectionId.value)) {
    activeSectionId.value = sections.value[0].id
  }
  if (!teachersInSchedule.value.length) {
    activeTeacherId.value = null
    return
  }
  if (!activeTeacherId.value || !teachersInSchedule.value.some((teacher) => teacher.id === activeTeacherId.value)) {
    activeTeacherId.value = teachersInSchedule.value[0].id
  }
}, { immediate: true })

watch(teachersInSchedule, (list) => {
  if (!list.length) {
    activeTeacherId.value = null
    return
  }
  if (!activeTeacherId.value || !list.find((teacher) => teacher.id === activeTeacherId.value)) {
    activeTeacherId.value = list[0].id
  }
}, { immediate: true })

// Teacher schedule data
const { data: teacherSchedule, pending: loadingTeacher, refresh: refreshTeacher } = useAsyncData(
  'teacher-schedule',
  () => activeTeacherId.value && activeSetId.value
    ? $fetch<{ teacher: any; teachingEntries: any[]; specialSlots: any[]; allSlotTimes: any[] }>(
        `/api/schedules/teacher/${activeTeacherId.value}`,
        { query: { scheduleSetId: activeSetId.value } },
      )
    : Promise.resolve({ teacher: null, teachingEntries: [], specialSlots: [], allSlotTimes: [] }),
  { watch: [activeTeacherId, activeSetId], default: () => ({ teacher: null, teachingEntries: [], specialSlots: [], allSlotTimes: [] }) },
)

// Per-section schedule data
const { data: sectionSchedule, pending: loadingSection, refresh: refreshSection } = useAsyncData(
  'section-schedule',
  () => activeSectionId.value && activeSetId.value
    ? $fetch<{ entries: any[]; slotVacancies: any }>(`/api/schedules/${activeSectionId.value}`, {
        query: { scheduleSetId: activeSetId.value },
      })
    : Promise.resolve({ entries: [], slotVacancies: {} }),
  { watch: [activeSectionId, activeSetId], default: () => ({ entries: [], slotVacancies: {} }) },
)

function switchTab(tabId: 'master' | 'section' | 'teacher') {
  activeView.value = tabId
  if (tabId === 'section') {
    if (!activeSectionId.value && sections.value?.length) {
      activeSectionId.value = sections.value[0].id
    } else {
      refreshSection()
    }
  }
  if (tabId === 'teacher') {
    if (!activeTeacherId.value && teachersInSchedule.value.length) {
      activeTeacherId.value = teachersInSchedule.value[0].id
    } else {
      refreshTeacher()
    }
  }
}

function formatDate(dt: string | null) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

function loadStoredConfig(setId: string | null) {
  if (!setId) return null
  try {
    const raw = localStorage.getItem(`sked-gen-config:${setId}`)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveConfig(setId: string, config: any) {
  try { localStorage.setItem(`sked-gen-config:${setId}`, JSON.stringify(config)) } catch {}
}

function openGenerateModal() {
  genMode.value = 'new'
  genName.value = ''
  lastConfig.value = null
  genSectionIds.value = sections.value?.map(s => s.id) ?? []
  showGenerateModal.value = true
}

function openRegenerateModal() {
  genMode.value = 'overwrite'
  genSectionIds.value = masterSchedule.value?.sections?.map((s: any) => s.id) ?? sections.value?.map(s => s.id) ?? []
  lastConfig.value = loadStoredConfig(activeSetId.value)
  showGenerateModal.value = true
}

function toggleAllGenSections() {
  if (genSectionIds.value.length === (sections.value?.length ?? 0)) {
    genSectionIds.value = []
  } else {
    genSectionIds.value = sections.value?.map(s => s.id) ?? []
  }
}

async function triggerGenerate(config: any = {}) {
  if (genMode.value === 'new' && !genName.value) { alert('Enter a schedule name.'); return }
  if (!genSectionIds.value.length) { alert('Select at least one section.'); return }
  generating.value = true
  try {
    const body: Record<string, any> = {
      sectionIds: genSectionIds.value,
      schoolYearId: yearId,
      config,
    }
    if (genMode.value === 'overwrite') {
      body.scheduleSetId = activeSetId.value
    } else {
      body.scheduleName = genName.value
    }
    const result = await $fetch<{ scheduleSetId: string; generated: number; shortfalls: any[] }>('/api/schedules/generate', {
      method: 'POST',
      body,
    })
    saveConfig(result.scheduleSetId, config)
    activeSetId.value = result.scheduleSetId
    showGenerateModal.value = false
    await refreshSets()
    await refreshMaster()
    if (result.shortfalls?.length) {
      shortfallWarning.value = result.shortfalls
      showShortfall.value = true
    }
  } catch (e: any) {
    alert(e?.data?.message ?? e?.message ?? 'Failed to generate. Please try again.')
  } finally {
    generating.value = false
  }
}

async function deleteActiveSet() {
  if (!activeSetId.value) return
  if (!confirm('Delete this schedule set? All entries will be removed.')) return
  await $fetch(`/api/schedule-sets/${activeSetId.value}`, { method: 'DELETE' })
  activeSetId.value = null
  await refreshSets()
  await refreshMaster()
}
</script>

<style scoped>
.export-menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.875rem;
  font-size: 0.8125rem;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-ink);
  transition: background 0.12s;
}
.export-menu-item:hover {
  background: var(--color-surface);
}
.export-menu-item + .export-menu-item {
  border-top: 1px solid var(--color-border);
}

.load-subject-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  line-height: 1.4;
  white-space: nowrap;
}
.load-chip-meta {
  font-size: 0.6875rem;
  opacity: 0.75;
}
.load-chip-hrs {
  font-size: 0.6875rem;
  font-weight: 700;
  opacity: 0.85;
}

/* ── Swap hint bar ───────────────────────────────────── */
.color-by-toggle {
  display: flex;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  overflow: hidden;
  font-size: 0.6875rem;
}
.color-by-toggle button {
  padding: 0.1875rem 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-muted);
  font-size: 0.6875rem;
  font-weight: 500;
  transition: background 0.1s, color 0.1s;
  white-space: nowrap;
}
.color-by-toggle button + button {
  border-left: 1px solid var(--color-border);
}
.color-by-toggle button.active {
  background: var(--color-primary, oklch(0.35 0.12 15));
  color: white;
}
.color-by-toggle button:not(.active):hover {
  background: var(--color-surface);
  color: var(--color-ink);
}

.swap-hint-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4375rem 0.875rem;
  border-radius: 0.5rem;
  background: oklch(0.95 0.02 250 / 0.6);
  border: 1px solid oklch(0.85 0.05 250 / 0.5);
  color: oklch(0.38 0.1 250);
  font-size: 0.75rem;
}

/* (swap modal styles are in the non-scoped block below) */
</style>

<style>
/* ── Swap modal (non-scoped: Teleport renders outside component root) ───── */
.swap-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: oklch(0.1 0 0 / 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  cursor: default;
}
.swap-modal-box {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 20px 60px oklch(0.1 0 0 / 0.18), 0 4px 16px oklch(0.1 0 0 / 0.1);
  width: 100%;
  max-width: 560px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.swap-modal-header {
  padding: 1.125rem 1.25rem 0.875rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  position: relative;
}
.swap-modal-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}
.swap-modal-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-ink);
  letter-spacing: -0.01em;
}
.swap-modal-source {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--color-muted);
  flex-wrap: wrap;
}
.swap-section-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  background: var(--color-border-light, #ede9e3);
  color: var(--color-ink);
  font-size: 0.6875rem;
  font-weight: 600;
  white-space: nowrap;
}
.swap-modal-meta {
  font-size: 0.75rem;
  color: var(--color-muted);
}
.swap-modal-close {
  position: absolute;
  top: 0.875rem;
  right: 1rem;
  padding: 0.375rem;
  border-radius: 0.375rem;
  color: var(--color-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s, color 0.1s;
}
.swap-modal-close:hover {
  background: var(--color-surface);
  color: var(--color-ink);
}
.swap-modal-body {
  overflow-y: auto;
  padding: 1rem 1.25rem 1.25rem;
  flex: 1;
}
.swap-modal-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-muted);
  padding: 1rem 0;
}
.swap-modal-status--error {
  color: var(--color-danger, oklch(0.5 0.2 25));
}
.swap-section {
  margin-bottom: 1.25rem;
}
.swap-section:last-child { margin-bottom: 0; }
.swap-section-label {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-muted);
  margin-bottom: 0.5rem;
}
.swap-section-hint {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: var(--color-placeholder);
}
.swap-empty {
  font-size: 0.8125rem;
  color: var(--color-placeholder);
  padding: 0.25rem 0;
}
.swap-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.swap-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.625rem;
  background: var(--color-surface, #f8f7f5);
  font-size: 0.75rem;
  flex-wrap: wrap;
  border: 1px solid var(--color-border-light, #ede9e3);
}
.swap-row--3way {
  background: oklch(0.97 0.012 270);
  border-color: oklch(0.9 0.03 270);
  align-items: flex-start;
}
.swap-row-meta {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-ink);
}
.swap-row-teacher {
  font-size: 0.6875rem;
  color: var(--color-placeholder);
}
.swap-chain {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}
.swap-chip {
  display: inline-block;
  padding: 0.125rem 0.5625rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 700;
  white-space: nowrap;
}
.swap-chip--sm {
  font-size: 0.625rem;
  padding: 0.0625rem 0.375rem;
}
.swap-arrow {
  font-size: 0.75rem;
  color: var(--color-muted);
}
.swap-via-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-muted);
  font-size: 0.6875rem;
}
.swap-tag {
  font-size: 0.5625rem;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}
.swap-tag--same {
  background: oklch(0.92 0.05 250);
  color: oklch(0.38 0.1 250);
}
.swap-exec-btn {
  margin-left: auto;
  flex-shrink: 0;
  align-self: center;
  padding: 0.25rem 0.75rem !important;
  font-size: 0.75rem !important;
  cursor: pointer;
}

/* 3-way rotation layout */
.swap-row--3way {
  align-items: flex-start;
  gap: 0.75rem;
}
.swap-rotation {
  display: flex;
  flex-direction: column;
  gap: 0.3125rem;
  flex: 1;
  min-width: 0;
}
.swap-rotation-slot {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
  font-size: 0.75rem;
}
.swap-rotation-teacher {
  font-size: 0.6875rem;
  color: var(--color-muted);
  font-weight: 500;
}
.swap-rotation-time {
  font-size: 0.6875rem;
  color: var(--color-placeholder);
}
.swap-rotation-arrow {
  font-size: 0.6875rem;
  color: var(--color-primary, oklch(0.4 0.15 20));
  font-weight: 600;
  white-space: nowrap;
}

/* Modal enter/leave transition */
.swap-modal-enter-active { transition: opacity 0.18s ease; }
.swap-modal-leave-active  { transition: opacity 0.15s ease; }
.swap-modal-enter-active .swap-modal-box,
.swap-modal-leave-active  .swap-modal-box {
  transition: transform 0.18s ease, opacity 0.18s ease;
}
.swap-modal-enter-from,
.swap-modal-leave-to {
  opacity: 0;
}
.swap-modal-enter-from .swap-modal-box,
.swap-modal-leave-to  .swap-modal-box {
  transform: translateY(10px) scale(0.97);
  opacity: 0;
}
</style>

