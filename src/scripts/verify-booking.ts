
import { db } from '@/db';
import { bookings, availabilityExceptions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getDailySlots } from '@/lib/availability';
import { addDays, format } from 'date-fns';
import { nanoid } from 'nanoid';

// Helper to simulate POST /api/bookings
async function createBooking(date: string, time: string, serviceId: string) {
    const { POST } = await import('@/app/api/bookings/route');

    // We construct a Request object to mimic the client call
    const req = new Request('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
            serviceId,
            serviceName: "Test Service",
            selectedOptions: [],
            date,
            time,
            customer: {
                name: "Test User " + nanoid(4),
                email: "test@example.com",
                phone: "123456789"
            }
        })
    });

    return POST(req);
}

async function runVerification() {
    console.log("Starting Verification...");

    // 1. Setup Data
    const today = new Date();
    const testDate = addDays(today, 7); // Use a date in future
    const dateStr = format(testDate, 'yyyy-MM-dd');
    console.log(`Testing with date: ${dateStr}`);

    // Reset data for this date
    await db.delete(bookings).where(eq(bookings.date, dateStr));
    await db.delete(availabilityExceptions).where(eq(availabilityExceptions.startDate, dateStr));

    // Set explicit hours for this day via Exception (to be sure)
    await db.insert(availabilityExceptions).values({
        id: nanoid(),
        startDate: dateStr,
        endDate: dateStr,
        morningStart: "10:00",
        morningEnd: "14:00",
        afternoonStart: null,
        afternoonEnd: null,
        isClosed: false
    });

    // Get valid service
    const service = await db.query.services.findFirst();
    if (!service) {
        console.error("No service found. Seed DB first.");
        return;
    }
    console.log(`Using Service: ${service.name} (${service.duration} mins)`);

    // 2. Concurrency Test
    console.log("\n--- Concurrency Test ---");
    // Try to book 10:00 5 times in parallel
    const promises = Array(5).fill(0).map((_, i) => createBooking(dateStr, "10:00", service.id));

    // We expect some to fail with 409 or 500 (Busy)
    await Promise.allSettled(promises);

    // Check DB for duplicates
    const bookingsFor10 = await db.select().from(bookings).where(
        and(
            eq(bookings.date, dateStr),
            eq(bookings.startTime, "10:00")
        )
    );

    console.log(`Bookings created for 10:00: ${bookingsFor10.length}`);
    if (bookingsFor10.length === 1) {
        console.log("✅ Concurrency PASSED (Exactly 1 booking created)");
    } else if (bookingsFor10.length === 0) {
        console.log("⚠️ Concurrency Safety PASSED (0 created - Lock contention prevented all, but double booking prevented)");
        // Create one manually to proceed with Dynamic Slot test
        console.log("Creating manual booking for 10:00 to continue test...");
        await createBooking(dateStr, "10:00", service.id);
    } else {
        console.error(`❌ Concurrency FAILED (${bookingsFor10.length} bookings created)`);
    }

    // 3. Dynamic Slot Test
    console.log("\n--- Dynamic Slot Test ---");
    // We have one booking at 10:00.
    const slots = await getDailySlots(testDate, service.duration);
    console.log("Available Slots:", slots);

    const has1000 = slots.includes("10:00");
    const has1030 = slots.includes("10:30");

    // 10:00 should be gone
    if (!has1000) console.log("✅ 10:00 is correctly removed");
    else console.error("❌ 10:00 is still available");

    // Check next slot Logic
    let endTimeWithBuffer = 10 * 60 + service.duration + 10;
    let slot1030Start = 10 * 60 + 30; // 630

    if (slot1030Start < endTimeWithBuffer) {
        if (!has1030) console.log(`✅ 10:30 is correctly blocked`);
        else console.error(`❌ 10:30 should be blocked`);
    } else {
        if (has1030) console.log(`✅ 10:30 is available`);
        else console.error(`❌ 10:30 should be available`);
    }

    // 4. Break/Close Test
    console.log("\n--- Boundary Test ---");
    // Try to book late slot that exceeds 14:00 (Close time)
    // If we assume a 45 min service, 13:30 ends at 14:15.
    // 14:15 > 14:00 -> Rejected.

    const resLate = await createBooking(dateStr, "13:30", service.id);
    if (resLate.status !== 200) {
        let json: any = {};
        try { json = await resLate.json(); } catch (e) { }
        console.log("✅ Late booking rejected correctly:", json.error || resLate.status);
    } else {
        console.error("❌ Late booking accepted (Should fail)");
    }

    console.log("\nVerification Complete.");
}

runVerification().catch(console.error);
