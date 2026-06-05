CREATE TABLE `extra_breaks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`schedule_config_id` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`label` text,
	FOREIGN KEY (`schedule_config_id`) REFERENCES `schedule_configs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `schedule_configs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`section_id` integer NOT NULL,
	`start_time` text DEFAULT '07:00' NOT NULL,
	`end_time` text DEFAULT '17:00' NOT NULL,
	`recess_start` text DEFAULT '09:00' NOT NULL,
	`recess_end` text DEFAULT '09:15' NOT NULL,
	`lunch_start` text DEFAULT '12:00' NOT NULL,
	`lunch_end` text DEFAULT '13:00' NOT NULL,
	`slot_duration_minutes` integer DEFAULT 60 NOT NULL,
	`avoid_consecutive_same_subject` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `schedule_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`section_id` integer NOT NULL,
	`subject_id` integer NOT NULL,
	`teacher_id` integer NOT NULL,
	`day_of_week` integer NOT NULL,
	`slot_start_time` text NOT NULL,
	`slot_end_time` text NOT NULL,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `schedule_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `school_years` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`schedule_type_id` integer NOT NULL,
	`label` text NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`schedule_type_id`) REFERENCES `schedule_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `schools` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`phone` text,
	`email` text,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `sections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_year_id` integer NOT NULL,
	`year_level_id` integer NOT NULL,
	`name` text NOT NULL,
	`adviser_id` integer,
	FOREIGN KEY (`school_year_id`) REFERENCES `school_years`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`year_level_id`) REFERENCES `year_levels`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`adviser_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`schedule_type_id` integer NOT NULL,
	`name` text NOT NULL,
	`hours_per_week` integer DEFAULT 4 NOT NULL,
	`color_hex` text DEFAULT '#6366f1' NOT NULL,
	FOREIGN KEY (`schedule_type_id`) REFERENCES `schedule_types`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `teacher_subjects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`teacher_id` integer NOT NULL,
	`subject_id` integer NOT NULL,
	`year_level_id` integer NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`year_level_id`) REFERENCES `year_levels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `teachers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`name` text NOT NULL,
	`max_hours_per_week` integer DEFAULT 40 NOT NULL,
	`max_hours_per_day` integer DEFAULT 8 NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `year_levels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`schedule_type_id` integer NOT NULL,
	`name` text NOT NULL,
	`grade_number` integer NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`schedule_type_id`) REFERENCES `schedule_types`(`id`) ON UPDATE no action ON DELETE cascade
);
