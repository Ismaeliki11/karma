CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`public_notice_active` integer DEFAULT false NOT NULL,
	`public_notice_message` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
DROP INDEX `availability_exceptions_date_unique`;--> statement-breakpoint
ALTER TABLE `availability_exceptions` ADD `start_date` text NOT NULL;--> statement-breakpoint
ALTER TABLE `availability_exceptions` ADD `end_date` text NOT NULL;--> statement-breakpoint
ALTER TABLE `availability_exceptions` ADD `morning_start` text;--> statement-breakpoint
ALTER TABLE `availability_exceptions` ADD `morning_end` text;--> statement-breakpoint
ALTER TABLE `availability_exceptions` ADD `afternoon_start` text;--> statement-breakpoint
ALTER TABLE `availability_exceptions` ADD `afternoon_end` text;--> statement-breakpoint
ALTER TABLE `availability_exceptions` DROP COLUMN `date`;--> statement-breakpoint
ALTER TABLE `availability_exceptions` DROP COLUMN `open_time`;--> statement-breakpoint
ALTER TABLE `availability_exceptions` DROP COLUMN `close_time`;--> statement-breakpoint
ALTER TABLE `availability_exceptions` DROP COLUMN `break_start`;--> statement-breakpoint
ALTER TABLE `availability_exceptions` DROP COLUMN `break_end`;--> statement-breakpoint
ALTER TABLE `business_hours` ADD `morning_start` text;--> statement-breakpoint
ALTER TABLE `business_hours` ADD `morning_end` text;--> statement-breakpoint
ALTER TABLE `business_hours` ADD `afternoon_start` text;--> statement-breakpoint
ALTER TABLE `business_hours` ADD `afternoon_end` text;--> statement-breakpoint
ALTER TABLE `business_hours` DROP COLUMN `open_time`;--> statement-breakpoint
ALTER TABLE `business_hours` DROP COLUMN `close_time`;--> statement-breakpoint
ALTER TABLE `business_hours` DROP COLUMN `break_start`;--> statement-breakpoint
ALTER TABLE `business_hours` DROP COLUMN `break_end`;