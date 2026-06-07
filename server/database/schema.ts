import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// UUID tables — IDs exposed in URL routes
export const schools = sqliteTable('schools', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
})

export const scheduleTypes = sqliteTable('schedule_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
})

// Integer-PK tables — internal / connector
export const yearLevels = sqliteTable('year_levels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  scheduleTypeId: integer('schedule_type_id').notNull().references(() => scheduleTypes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  gradeNumber: integer('grade_number').notNull(),
  sortOrder: integer('sort_order').notNull(),
})

export const subjects = sqliteTable('subjects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  scheduleTypeId: integer('schedule_type_id').notNull().references(() => scheduleTypes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  hoursPerWeek: integer('hours_per_week').notNull().default(4),
  colorHex: text('color_hex').notNull().default('#6366f1'),
})

export const schoolYears = sqliteTable('school_years', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  scheduleTypeId: integer('schedule_type_id').notNull().references(() => scheduleTypes.id),
  label: text('label').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
})

export const teachers = sqliteTable('teachers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  maxHoursPerWeek: integer('max_hours_per_week').notNull().default(40),
  maxHoursPerDay: integer('max_hours_per_day').notNull().default(8),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
})

export const teacherSubjects = sqliteTable('teacher_subjects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teacherId: text('teacher_id').notNull().references(() => teachers.id, { onDelete: 'cascade' }),
  subjectId: integer('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  yearLevelId: integer('year_level_id').notNull().references(() => yearLevels.id, { onDelete: 'cascade' }),
  sectionCount: integer('section_count').notNull().default(1),
})

export const sections = sqliteTable('sections', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  schoolYearId: text('school_year_id').notNull().references(() => schoolYears.id, { onDelete: 'cascade' }),
  yearLevelId: integer('year_level_id').notNull().references(() => yearLevels.id),
  name: text('name').notNull(),
  adviserId: text('adviser_id').references(() => teachers.id),
})

export const scheduleConfigs = sqliteTable('schedule_configs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sectionId: text('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
  startTime: text('start_time').notNull().default('07:00'),
  endTime: text('end_time').notNull().default('17:00'),
  recessStart: text('recess_start').notNull().default('09:00'),
  recessEnd: text('recess_end').notNull().default('09:15'),
  lunchStart: text('lunch_start').notNull().default('12:00'),
  lunchEnd: text('lunch_end').notNull().default('13:00'),
  slotDurationMinutes: integer('slot_duration_minutes').notNull().default(60),
  avoidConsecutiveSameSubject: integer('avoid_consecutive_same_subject', { mode: 'boolean' }).notNull().default(true),
})

export const extraBreaks = sqliteTable('extra_breaks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  scheduleConfigId: integer('schedule_config_id').notNull().references(() => scheduleConfigs.id, { onDelete: 'cascade' }),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  label: text('label'),
})

export const scheduleSets = sqliteTable('schedule_sets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  schoolYearId: text('school_year_id').notNull().references(() => schoolYears.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
})

export const scheduleEntries = sqliteTable('schedule_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  scheduleSetId: text('schedule_set_id').notNull().references(() => scheduleSets.id, { onDelete: 'cascade' }),
  sectionId: text('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
  subjectId: integer('subject_id').references(() => subjects.id),
  teacherId: text('teacher_id').references(() => teachers.id),
  dayOfWeek: integer('day_of_week').notNull(),
  slotStartTime: text('slot_start_time').notNull(),
  slotEndTime: text('slot_end_time').notNull(),
  specialLabel: text('special_label'),
})
