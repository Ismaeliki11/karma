
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        console.log("Checking tables...");
        const result = await db.run(sql`SELECT name FROM sqlite_master WHERE type='table'`);
        console.log("Tables:", result.rows);

        console.log("Checking business_hours count...");
        const count = await db.run(sql`SELECT count(*) as c FROM business_hours`);
        console.log("Business Hours Count:", count.rows[0]);

    } catch (e) {
        console.error("DB Error:", JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
    }
}

main();
