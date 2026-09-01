CREATE TABLE `course_note_images` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`course_id` text NOT NULL,
	`chapter_id` integer NOT NULL,
	`level_id` integer NOT NULL,
	`object_key` text NOT NULL,
	`file_name` text NOT NULL,
	`content_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `course_note_images_object_key_unique` ON `course_note_images` (`object_key`);--> statement-breakpoint
CREATE INDEX `idx_course_note_images_owner_course_level` ON `course_note_images` (`owner_id`,`course_id`,`level_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `course_notes` (
	`owner_id` text NOT NULL,
	`course_id` text NOT NULL,
	`chapter_id` integer NOT NULL,
	`level_id` integer NOT NULL,
	`title` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`owner_id`, `course_id`, `level_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_course_notes_owner_course_chapter` ON `course_notes` (`owner_id`,`course_id`,`chapter_id`,`level_id`);