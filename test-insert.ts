
import { db } from './src/db';
import { availabilityExceptions } from './src/db/schema';
import { nanoid } from 'nanoid';

async function testInsert() {
    try {
        console.log("Testing insert into availability_exceptions...");
        await db.insert(availabilityExceptions).values({
            id: nanoid(),
            startDate: '2026-12-25',
            endDate: '2026-12-25',
            isClosed: true,
            reason: 'Test Festivo'
        });
        console.log("Insert success!");
    } catch (error) {
        console.error("Insert failed:", error);
    }
}

testInsert();
