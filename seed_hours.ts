import { db } from './src/db/index';
import { businessHours } from './src/db/schema';
import { nanoid } from 'nanoid';

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
            id: nanoid(),
            dayOfWeek: h.dayOfWeek,
            morningStart: h.open,
            morningEnd: h.breakS || h.close, // End morning at close if no break
            afternoonStart: h.breakE || null,
            afternoonEnd: h.breakE ? h.close : null, // Only have afternoon if there's a break
            isClosed: false
        }).onConflictDoUpdate({
            target: businessHours.dayOfWeek,
            set: {
                morningStart: h.open,
                morningEnd: h.breakS || h.close,
                afternoonStart: h.breakE || null,
                afternoonEnd: h.breakE ? h.close : null,
                isClosed: false
            }
        });
    }

    // Sun
    await db.insert(businessHours).values({
        id: nanoid(),
        dayOfWeek: 0,
        morningStart: null,
        morningEnd: null,
        afternoonStart: null,
        afternoonEnd: null,
        isClosed: true
    }).onConflictDoUpdate({
        target: businessHours.dayOfWeek,
        set: {
            morningStart: null,
            morningEnd: null,
            afternoonStart: null,
            afternoonEnd: null,
            isClosed: true
        }
    });

    console.log('Business hours seeded!');
    process.exit(0);
}

main().catch(console.error);
