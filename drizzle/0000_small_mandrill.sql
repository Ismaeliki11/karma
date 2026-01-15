CREATE TABLE `admins` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admins_username_unique` ON `admins` (`username`);--> statement-breakpoint
CREATE TABLE `availability_exceptions` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`open_time` text,
	`close_time` text,
	`is_closed` integer DEFAULT false NOT NULL,
	`reason` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `availability_exceptions_date_unique` ON `availability_exceptions` (`date`);--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`locator` text NOT NULL,
	`service_id` text,
	`customer_name` text NOT NULL,
	`customer_email` text NOT NULL,
	`customer_phone` text NOT NULL,
	`date` text NOT NULL,
	`start_time` text NOT NULL,
	`start_at` integer NOT NULL,
	`end_at` integer NOT NULL,
	`selected_options` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_locator_unique` ON `bookings` (`locator`);--> statement-breakpoint
CREATE TABLE `business_hours` (
	`id` text PRIMARY KEY NOT NULL,
	`day_of_week` integer NOT NULL,
	`open_time` text NOT NULL,
	`close_time` text NOT NULL,
	`break_start` text,
	`break_end` text,
	`is_closed` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `business_hours_day_of_week_unique` ON `business_hours` (`day_of_week`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`price` integer NOT NULL,
	`duration` integer NOT NULL,
	`image_url` text
);
--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`token` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`expires` integer NOT NULL,
	`related_booking_id` text
);
