CREATE TABLE `interview_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` integer NOT NULL,
	`answer_text` text NOT NULL,
	`score` integer NOT NULL,
	`diagnosis_json` text NOT NULL,
	`weak_tags_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `interview_competency_scores` (
	`competency` text PRIMARY KEY NOT NULL,
	`score` integer NOT NULL,
	`evidence_count` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `interview_market_signals` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`competency` text NOT NULL,
	`source_url` text NOT NULL,
	`source_type` text NOT NULL,
	`observed_at` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `interview_plan_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`competency` text NOT NULL,
	`reason` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`source_attempt_id` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `interview_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`current_role` text NOT NULL,
	`target_role` text NOT NULL,
	`horizon` text NOT NULL,
	`focus` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `interview_questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`prompt` text NOT NULL,
	`competency` text NOT NULL,
	`tags_json` text NOT NULL,
	`source_type` text NOT NULL,
	`source_ref` text NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
