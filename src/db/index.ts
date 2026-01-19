
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables for standalone scripts
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });


const dbUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

let client;

console.log("DB_INIT: Checking environment variables...");
console.log("DB_INIT: TURSO_DATABASE_URL set?", !!dbUrl, dbUrl?.substring(0, 10) + "...");
console.log("DB_INIT: TURSO_AUTH_TOKEN set?", !!authToken, authToken ? "token exists (length: " + authToken.length + ")" : "token missing");

try {
    if (!dbUrl) {
        console.error("DB_INIT_ERROR: TURSO_DATABASE_URL is missing!");
    }

    // Force HTTPS for Vercel/Serverless compatibility if protocol is libsql://
    const finalUrl = dbUrl?.replace("libsql://", "https://");

    client = createClient({
        url: finalUrl || "file:local.db",
        authToken: authToken,
    });
    console.log("DB_INIT: LibSQL client created.");
} catch (e) {
    console.error("DB_INIT_FATAL: Failed to initialize LibSQL client:", e);
    throw e;
}

export const db = drizzle(client, { schema });
console.log("DB_INIT: Drizzle instance exported.");
