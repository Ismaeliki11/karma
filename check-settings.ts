import { db } from './src/db';
import { settings } from './src/db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

async function checkSettings() {
    try {
        const result = await db.select().from(settings).limit(1);
        console.log("Current Settings in DB:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Error reading DB:", e);
    }
}

checkSettings();
