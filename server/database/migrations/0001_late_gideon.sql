PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_schedule_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`school_year_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text,
	FOREIGN KEY (`school_year_id`) REFERENCES `school_years`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_schedule_sets`("id", "school_year_id", "name", "created_at") SELECT "id", "school_year_id", "name", "created_at" FROM `schedule_sets`;--> statement-breakpoint
DROP TABLE `schedule_sets`;--> statement-breakpoint
ALTER TABLE `__new_schedule_sets` RENAME TO `schedule_sets`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_school_years` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`schedule_type_id` integer NOT NULL,
	`label` text NOT NULL,
	`start_year` integer,
	`end_year` integer,
	`semester` text,
	`is_active` integer DEFAULT true,
	`created_at` text,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`schedule_type_id`) REFERENCES `schedule_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_school_years`("id", "school_id", "schedule_type_id", "label", "is_active", "created_at") SELECT "id", "school_id", "schedule_type_id", "label", "is_active", "created_at" FROM `school_years`;--> statement-breakpoint
DROP TABLE `school_years`;--> statement-breakpoint
ALTER TABLE `__new_school_years` RENAME TO `school_years`;--> statement-breakpoint
CREATE TABLE `__new_schools` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`phone` text,
	`email` text,
	`created_at` text
);
--> statement-breakpoint
INSERT INTO `__new_schools`("id", "name", "address", "phone", "email", "created_at") SELECT "id", "name", "address", "phone", "email", "created_at" FROM `schools`;--> statement-breakpoint
DROP TABLE `schools`;--> statement-breakpoint
ALTER TABLE `__new_schools` RENAME TO `schools`;--> statement-breakpoint
CREATE TABLE `__new_teachers` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`name` text NOT NULL,
	`color_hex` text DEFAULT '#a5b4fc' NOT NULL,
	`max_hours_per_week` integer DEFAULT 40 NOT NULL,
	`max_hours_per_day` integer DEFAULT 8 NOT NULL,
	`created_at` text,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_teachers`("id", "school_id", "name", "max_hours_per_week", "max_hours_per_day", "created_at") SELECT "id", "school_id", "name", "max_hours_per_week", "max_hours_per_day", "created_at" FROM `teachers`;--> statement-breakpoint
DROP TABLE `teachers`;--> statement-breakpoint
ALTER TABLE `__new_teachers` RENAME TO `teachers`;