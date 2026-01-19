
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';


const dbUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

let client;

try {
    if (!dbUrl) {
        console.warn("WARNING: TURSO_DATABASE_URL is not set. Database operations will fail.");
        // Create a dummy client or handle this case. 
        // For now, we prefer not to crash the app on import.
        // We'll use a memory DB or just let it fail later?
        // Better: don't initialize client if no URL.
    }

    client = createClient({
        url: dbUrl || "file:local.db", // Fallback only for local dev, might fail on Netlify but better than crash
        authToken: authToken,
    });
} catch (e) {
    console.error("Failed to initialize LibSQL client:", e);
    // Use a null object or similar? 
    // If we throw here, we crash the app. 
    // We'll proceed, but db calls will fail.
}

export const db = drizzle(client!, { schema });
