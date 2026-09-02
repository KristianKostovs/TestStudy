CREATE TABLE `course_content_overrides` (
	`content_key` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`level_id` integer NOT NULL,
	`section` text NOT NULL,
	`content_json` text NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_course_content_course_level_section` ON `course_content_overrides` (`course_id`,`level_id`,`section`);