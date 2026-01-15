import { db } from './src/db/index';
import { businessHours } from './src/db/schema';

async function main() {
    console.log('Seeding default business hours...');

    const defaults = [
        { dayOfWeek: 1, open: "10:00", close: "20:00", breakS: "14:00", breakE: "16:00" }, // Mon
        { dayOfWeek: 2, open: "10:00", close: "20:00", breakS: "14:00", breakE: "16:00" }, // Tue
        { dayOfWeek: 3, open: "10:00", close: "20:00", breakS: "14:00", breakE: "16:00" }, // Wed
        { dayOfWeek: 4, open: "10:00", close: "20:00", breakS: "14:00", breakE: "16:00" }, // Thu
        { dayOfWeek: 5, open: "10:00", close: "20:00", breakS: "14:00", breakE: "16:00" }, // Fri
        { dayOfWeek: 6, open: "10:00", close: "14:00", breakS: null, breakE: null },    // Sat
    ];

    for (const h of defaults) {
        await db.insert(businessHours).values({
            id: `default-${h.dayOfWeek}`,
            dayOfWeek: h.dayOfWeek,
            openTime: h.open,
            closeTime: h.close,
            breakStart: h.breakS,
            breakEnd: h.breakE,
            isClosed: false
        }).onConflictDoUpdate({
            target: businessHours.dayOfWeek,
            set: {
                openTime: h.open,
                closeTime: h.close,
                breakStart: h.breakS,
                breakEnd: h.breakE
            }
        });
    }

    // Sun
    await db.insert(businessHours).values({
        id: 'default-0',
        dayOfWeek: 0,
        openTime: "00:00",
        closeTime: "00:00",
        isClosed: true
    }).onConflictDoUpdate({
        target: businessHours.dayOfWeek,
        set: { isClosed: true }
    });

    console.log('Business hours seeded!');
    process.exit(0);
}

main().catch(console.error);
