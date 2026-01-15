
import { db } from '@/db';
import { bookings } from '@/db/schema';

async function listAll() {
    console.log("Listing ALL bookings...");
    const all = await db.select().from(bookings);
    console.log(`Total Bookings: ${all.length}`);
    all.forEach(b => {
        console.log(`
ID: ${b.id}
Date (Col): ${b.date}
Time (Col): ${b.startTime}
StartAt (TS): ${b.startAt} (${new Date(b.startAt).toISOString()})
EndAt (TS):   ${b.endAt} (${new Date(b.endAt).toISOString()})
Status: ${b.status}
        `);
    });
}

listAll().catch(console.error);
