
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const dbUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log("DEBUG: TURSO_DATABASE_URL =", dbUrl);
console.log("DEBUG: TURSO_AUTH_TOKEN length =", authToken?.length);

const client = createClient({
    url: dbUrl!,
    authToken: authToken,
});

async function runDebug() {
    try {
        console.log("Testing connection with SELECT 1...");
        const res1 = await client.execute("SELECT 1");
        console.log("SELECT 1 Success:", !!res1);

        console.log("Checking table structure via SQL directly...");
        const res2 = await client.execute("PRAGMA table_info(availability_exceptions)");
        console.log("PRAGMA Result rows:", res2.rows.length);
        res2.rows.forEach(r => console.log(`  ${r.name} (${r.type})`));

        console.log("Executing DROP and CREATE in one go...");
        await client.execute("DROP TABLE IF EXISTS availability_exceptions");
        await client.execute(`CREATE TABLE availability_exceptions (
            id text PRIMARY KEY NOT NULL,
            start_date text NOT NULL,
            end_date text NOT NULL,
            morning_start text,
            morning_end text,
            afternoon_start text,
            afternoon_end text,
            is_closed integer DEFAULT 0 NOT NULL,
            reason text
        )`);

        console.log("Verifying again after change...");
        const res3 = await client.execute("PRAGMA table_info(availability_exceptions)");
        res3.rows.forEach(r => console.log(`  CONFIRM: ${r.name} (${r.type})`));

    } catch (e) {
        console.error("DEBUG ERROR:", e);
    }
}

runDebug();
