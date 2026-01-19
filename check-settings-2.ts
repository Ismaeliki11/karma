import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
    url: url!,
    authToken: authToken!,
});

async function checkSettings() {
    try {
        console.log("Checking settings table...");
        const result = await client.execute("SELECT * FROM settings");
        console.log("Current Settings in DB:", JSON.stringify(result.rows, null, 2));
    } catch (e) {
        console.error("Error reading DB:", e);
    } finally {
        client.close();
    }
}

checkSettings();
