CREATE TABLE `community_tips` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`view_slug` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_tips_view_created` ON `community_tips` (`view_slug`,`created_at`);--> statement-breakpoint
CREATE TABLE `user_view_states` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`view_slug` text NOT NULL,
	`saved` integer DEFAULT false NOT NULL,
	`visited` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_user_view_state_unique` ON `user_view_states` (`user_id`,`view_slug`);--> statement-breakpoint
CREATE INDEX `idx_user_view_state_user` ON `user_view_states` (`user_id`);--> statement-breakpoint
CREATE TABLE `viewpoint_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`coordinates` text NOT NULL,
	`look_direction` text,
	`photo_key` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_submissions_user_created` ON `viewpoint_submissions` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_submissions_status_created` ON `viewpoint_submissions` (`status`,`created_at`);
--> statement-breakpoint
PRAGMA optimize;
