import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function migrate() {
    console.log("Starting manual migration...");

    const tables = [
        {
            name: "business_hours",
            columns: ["morning_start", "morning_end", "afternoon_start", "afternoon_end"]
        },
        {
            name: "availability_exceptions",
            columns: ["start_date", "end_date", "morning_start", "morning_end", "afternoon_start", "afternoon_end"]
        }
    ];

    for (const table of tables) {
        for (const column of table.columns) {
            try {
                console.log(`Adding column ${column} to ${table.name}...`);
                await client.execute(`ALTER TABLE ${table.name} ADD COLUMN ${column} TEXT;`);
            } catch (e: any) {
                if (e.message.includes("duplicate column name")) {
                    console.log(`Column ${column} already exists in ${table.name}.`);
                } else {
                    console.error(`Error adding ${column} to ${table.name}:`, e.message);
                }
            }
        }
    }

    // Special check for settings table
    try {
        console.log("Checking settings table...");
        await client.execute(`
            CREATE TABLE IF NOT EXISTS settings (
                id TEXT PRIMARY KEY NOT NULL,
                public_notice_active INTEGER DEFAULT 0 NOT NULL,
                public_notice_message TEXT DEFAULT '' NOT NULL
            );
        `);
    } catch (e: any) {
        console.error("Error creating/checking settings table:", e.message);
    }

    // Check for deleted columns is harder in SQLite (requires recreating table)
    // But adding new ones is enough to stop the 500 errors if Drizzle can select them.

    console.log("Migration finished.");
}

migrate().catch(console.error);
