
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getDailySlots } from '@/lib/availability';
import { format } from 'date-fns';

async function debugState() {
    const dateStr = "2026-01-14"; // The date the user is trying to book
    console.log(`Debugging state for ${dateStr}...`);

    // 1. Check existing bookings
    const existing = await db.select().from(bookings).where(eq(bookings.date, dateStr));
    console.log(`Found ${existing.length} bookings:`);
    existing.forEach(b => {
        console.log(`- ID: ${b.id}, Time: ${b.startTime}, Status: ${b.status}, StartAt: ${b.startAt}, EndAt: ${b.endAt}`);
    });

    // 2. Check slots from engine
    // Assuming service duration is 45 mins (based on screenshot "Manicura Tradicional")
    // Retrieve service duration first?
    const service = await db.query.services.findFirst({
        where: (services, { eq }) => eq(services.name, 'Manicura Tradicional')
    });

    let duration = 45;
    if (service) {
        console.log(`Service found: ${service.name}, Duration: ${service.duration}`);
        duration = service.duration;
    } else {
        console.log("Service 'Manicura Tradicional' not found, assuming 45 mins.");
    }

    console.log(`failed duration: ${duration}`);

    const slots = await getDailySlots(new Date(dateStr), duration);
    console.log("Available Slots returned by engine:", slots);

    if (slots.includes("10:00")) {
        console.log("✅ Engine says 10:00 is AVAILABLE.");
    } else {
        console.log("❌ Engine says 10:00 is UNAVAILABLE.");
    }
}

debugState().catch(console.error);
