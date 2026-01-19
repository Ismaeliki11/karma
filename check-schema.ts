
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkSchema() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    try {
        const rs = await client.execute("PRAGMA table_info(services);");
        console.log("Schema of 'services':", rs.rows);

        const rs2 = await client.execute("PRAGMA table_info(settings);");
        console.log("Schema of 'settings':", rs2.rows);
    } catch (e) {
        console.error("Error checking schema:", e);
    }
}

checkSchema();
