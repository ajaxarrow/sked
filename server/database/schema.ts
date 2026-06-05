import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const schools = sqliteTable('schools', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
})

export const scheduleTypes = sqliteTable('schedule_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  schoolId: integer('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
})

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
  id: integer('id').primaryKey({ autoIncrement: true }),
  schoolId: integer('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  scheduleTypeId: integer('schedule_type_id').notNull().references(() => scheduleTypes.id),
  label: text('label').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
})

export const teachers = sqliteTable('teachers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  schoolId: integer('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  maxHoursPerWeek: integer('max_hours_per_week').notNull().default(40),
  maxHoursPerDay: integer('max_hours_per_day').notNull().default(8),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
})

export const teacherSubjects = sqliteTable('teacher_subjects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teacherId: integer('teacher_id').notNull().references(() => teachers.id, { onDelete: 'cascade' }),
  subjectId: integer('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  yearLevelId: integer('year_level_id').notNull().references(() => yearLevels.id, { onDelete: 'cascade' }),
})

export const sections = sqliteTable('sections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  schoolYearId: integer('school_year_id').notNull().references(() => schoolYears.id, { onDelete: 'cascade' }),
  yearLevelId: integer('year_level_id').notNull().references(() => yearLevels.id),
  name: text('name').notNull(),
  adviserId: integer('adviser_id').references(() => teachers.id),
})

export const scheduleConfigs = sqliteTable('schedule_configs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sectionId: integer('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
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

export const scheduleEntries = sqliteTable('schedule_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sectionId: integer('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
  subjectId: integer('subject_id').notNull().references(() => subjects.id),
  teacherId: integer('teacher_id').notNull().references(() => teachers.id),
  dayOfWeek: integer('day_of_week').notNull(),
  slotStartTime: text('slot_start_time').notNull(),
  slotEndTime: text('slot_end_time').notNull(),
})
