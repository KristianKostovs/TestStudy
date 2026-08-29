CREATE TABLE `course_grading_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` text NOT NULL,
	`level_id` integer NOT NULL,
	`answer_text` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`grade_json` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`claimed_at` text,
	`completed_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_course_grading_owner_status_created` ON `course_grading_submissions` (`owner_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_course_grading_owner_level_created` ON `course_grading_submissions` (`owner_id`,`level_id`,`created_at`);