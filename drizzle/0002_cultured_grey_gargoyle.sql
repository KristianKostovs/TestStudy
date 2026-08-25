CREATE TABLE `interview_capability_modules` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`tone` text NOT NULL,
	`kind` text NOT NULL,
	`competency` text NOT NULL,
	`base_priority` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`content_json` text NOT NULL,
	`source_strategy` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_interview_modules_status_priority` ON `interview_capability_modules` (`status`,`base_priority`);