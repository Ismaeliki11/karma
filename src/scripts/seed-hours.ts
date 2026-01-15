
import { db } from '@/db';
import { businessHours } from '@/db/schema';

async function seedHours() {
    console.log("Seeding Business Hours...");

    // Default Schedule:
    // Mon (1) - Fri (5): 10:00 - 20:00
    // Sat (6): 10:00 - 14:00
    // Sun (0): Closed

    const weekDays = [1, 2, 3, 4, 5];

    for (const day of weekDays) {
        await db.insert(businessHours).values({
            id: `dow-${day}`,
            dayOfWeek: day,
            openTime: "10:00",
            closeTime: "20:00",
            isClosed: false
        }).onConflictDoNothing();
    }

    // Saturday
    await db.insert(businessHours).values({
        id: `dow-6`,
        dayOfWeek: 6,
        openTime: "10:00",
        closeTime: "14:00",
        isClosed: false
    }).onConflictDoNothing();

    // Sunday
    await db.insert(businessHours).values({
        id: `dow-0`,
        dayOfWeek: 0,
        openTime: "10:00",
        closeTime: "10:00", // Irrelevant if closed
        isClosed: true
    }).onConflictDoNothing();

    console.log("✅ Business Hours Seeded.");
}

seedHours().catch(console.error);
