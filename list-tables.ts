
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkTables() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    try {
        const rs = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");
        console.log("Tables in DB:", rs.rows.map(r => r.name));
    } catch (e) {
        console.error("Error listing tables:", e);
    }
}

checkTables();
