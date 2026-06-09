CREATE TABLE IF NOT EXISTS "schools" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "address" text,
  "phone" text,
  "email" text,
  "created_at" text
);

CREATE TABLE IF NOT EXISTS "schedule_types" (
  "id" serial PRIMARY KEY NOT NULL,
  "school_id" text NOT NULL,
  "name" text NOT NULL,
  FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "year_levels" (
  "id" serial PRIMARY KEY NOT NULL,
  "schedule_type_id" integer NOT NULL,
  "name" text NOT NULL,
  "grade_number" integer NOT NULL,
  "sort_order" integer NOT NULL,
  FOREIGN KEY ("schedule_type_id") REFERENCES "schedule_types"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "subjects" (
  "id" serial PRIMARY KEY NOT NULL,
  "schedule_type_id" integer NOT NULL,
  "name" text NOT NULL,
  "hours_per_week" integer NOT NULL DEFAULT 4,
  "color_hex" text NOT NULL DEFAULT '#6366f1',
  FOREIGN KEY ("schedule_type_id") REFERENCES "schedule_types"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "school_years" (
  "id" text PRIMARY KEY NOT NULL,
  "school_id" text NOT NULL,
  "schedule_type_id" integer NOT NULL,
  "label" text NOT NULL,
  "is_active" integer DEFAULT 1,
  "created_at" text,
  FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE,
  FOREIGN KEY ("schedule_type_id") REFERENCES "schedule_types"("id")
);

CREATE TABLE IF NOT EXISTS "teachers" (
  "id" text PRIMARY KEY NOT NULL,
  "school_id" text NOT NULL,
  "name" text NOT NULL,
  "max_hours_per_week" integer NOT NULL DEFAULT 40,
  "max_hours_per_day" integer NOT NULL DEFAULT 8,
  "created_at" text,
  FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "teacher_subjects" (
  "id" serial PRIMARY KEY NOT NULL,
  "teacher_id" text NOT NULL,
  "subject_id" integer NOT NULL,
  "year_level_id" integer NOT NULL,
  "section_count" integer NOT NULL DEFAULT 1,
  FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE,
  FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE,
  FOREIGN KEY ("year_level_id") REFERENCES "year_levels"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "sections" (
  "id" text PRIMARY KEY NOT NULL,
  "school_year_id" text NOT NULL,
  "year_level_id" integer NOT NULL,
  "name" text NOT NULL,
  "adviser_id" text,
  FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE CASCADE,
  FOREIGN KEY ("year_level_id") REFERENCES "year_levels"("id"),
  FOREIGN KEY ("adviser_id") REFERENCES "teachers"("id")
);

CREATE TABLE IF NOT EXISTS "schedule_configs" (
  "id" serial PRIMARY KEY NOT NULL,
  "section_id" text NOT NULL,
  "start_time" text NOT NULL DEFAULT '07:00',
  "end_time" text NOT NULL DEFAULT '17:00',
  "recess_start" text NOT NULL DEFAULT '09:00',
  "recess_end" text NOT NULL DEFAULT '09:15',
  "lunch_start" text NOT NULL DEFAULT '12:00',
  "lunch_end" text NOT NULL DEFAULT '13:00',
  "slot_duration_minutes" integer NOT NULL DEFAULT 60,
  "avoid_consecutive_same_subject" integer NOT NULL DEFAULT 1,
  FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "extra_breaks" (
  "id" serial PRIMARY KEY NOT NULL,
  "schedule_config_id" integer NOT NULL,
  "start_time" text NOT NULL,
  "end_time" text NOT NULL,
  "label" text,
  FOREIGN KEY ("schedule_config_id") REFERENCES "schedule_configs"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "schedule_sets" (
  "id" text PRIMARY KEY NOT NULL,
  "school_year_id" text NOT NULL,
  "name" text NOT NULL,
  "created_at" text,
  FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "schedule_entries" (
  "id" serial PRIMARY KEY NOT NULL,
  "schedule_set_id" text NOT NULL,
  "section_id" text NOT NULL,
  "subject_id" integer,
  "teacher_id" text,
  "day_of_week" integer NOT NULL,
  "slot_start_time" text NOT NULL,
  "slot_end_time" text NOT NULL,
  "special_label" text,
  FOREIGN KEY ("schedule_set_id") REFERENCES "schedule_sets"("id") ON DELETE CASCADE,
  FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE,
  FOREIGN KEY ("subject_id") REFERENCES "subjects"("id"),
  FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id")
);
