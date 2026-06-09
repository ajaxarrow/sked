ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "color_hex" text NOT NULL DEFAULT '#a5b4fc';
ALTER TABLE "school_years" ADD COLUMN IF NOT EXISTS "start_year" integer;
ALTER TABLE "school_years" ADD COLUMN IF NOT EXISTS "end_year" integer;
ALTER TABLE "school_years" ADD COLUMN IF NOT EXISTS "semester" text;
