
import { db } from '@/db';
import { businessHours } from '@/db/schema';

async function check() {
    const hours = await db.select().from(businessHours);
    console.log("Business Hours Count:", hours.length);
    console.log(hours);
}
check();
