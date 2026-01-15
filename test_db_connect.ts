import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

console.log("Checking credentials:");
console.log("URL:", process.env.TURSO_DATABASE_URL);
console.log("Token Length:", process.env.TURSO_AUTH_TOKEN ? process.env.TURSO_AUTH_TOKEN.length : 0);

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
    try {
        await client.execute('SELECT 1');
        console.log("Connection SUCCESS!");
    } catch (e) {
        console.error("Connection FAILED:", e);
    }
}

main();
