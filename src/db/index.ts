
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';


const dbUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

let client;

try {
    if (!dbUrl) {
        console.warn("WARNING: TURSO_DATABASE_URL is not set. Database operations will fail.");
    }

    client = createClient({
        url: dbUrl || "file:local.db",
        authToken: authToken,
    });
} catch (e) {
    console.error("Failed to initialize LibSQL client:", e);
    throw new Error("Database initialization failed");
}

export const db = drizzle(client, { schema });
