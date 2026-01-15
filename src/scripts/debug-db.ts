
import { createClient } from '@libsql/client';
import path from 'path';

const dbPath = path.resolve('local.db');
console.log("DB Path:", dbPath);

const client = createClient({
    url: `file:${dbPath.replace(/\\/g, '/')}`,
});

async function main() {
    try {
        console.log("Querying...");
        const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log("Tables:", result.rows);
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
