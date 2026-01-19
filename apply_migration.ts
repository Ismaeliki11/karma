
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
	url: process.env.TURSO_DATABASE_URL!,
	authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
	console.log("Starting migration (SAFE VERSION)...");

	const statements = [
		"DROP TABLE IF EXISTS `availability_exceptions` ",
		"CREATE TABLE `availability_exceptions` (" +
		"`id` text PRIMARY KEY NOT NULL, " +
		"`start_date` text NOT NULL, " +
		"`end_date` text NOT NULL, " +
		"`morning_start` text, " +
		"`morning_end` text, " +
		"`afternoon_start` text, " +
		"`afternoon_end` text, " +
		"`is_closed` integer DEFAULT 0 NOT NULL, " +
		"`reason` text " +
		")",
		"DROP TABLE IF EXISTS `business_hours` ",
		"CREATE TABLE `business_hours` (" +
		"`id` text PRIMARY KEY NOT NULL, " +
		"`day_of_week` integer NOT NULL, " +
		"`morning_start` text, " +
		"`morning_end` text, " +
		"`afternoon_start` text, " +
		"`afternoon_end` text, " +
		"`is_closed` integer DEFAULT 0 NOT NULL " +
		")",
		"CREATE UNIQUE INDEX IF NOT EXISTS `business_hours_day_of_week_unique` ON `business_hours` (`day_of_week`) ",
		"CREATE TABLE IF NOT EXISTS `settings` (" +
		"`id` text PRIMARY KEY NOT NULL, " +
		"`public_notice_active` integer DEFAULT 0 NOT NULL, " +
		"`public_notice_message` text DEFAULT '' NOT NULL " +
		")"
	];

	for (const stmt of statements) {
		console.log("Executing:", stmt.substring(0, 100) + "...");
		try {
			await client.execute(stmt);
			console.log("  Success");
		} catch (e: any) {
			console.error("  Error:", e.message);
		}
	}
	console.log("Migration finished.");
}

main();
