
import { db } from './index';
import { bookings, services } from './schema';
import { nanoid } from 'nanoid';

async function main() {
    console.log('Testing DB connection and constraint...');

    try {
        // 1. Check if service exists
        const service = await db.select().from(services).limit(1);
        console.log('Service found:', service);

        if (service.length === 0) {
            console.error('No services found in DB! Seed script might have failed or not run.');
            process.exit(1);
        }

        const testServiceId = service[0].id; // Use a real ID from DB

        // 2. Try to insert a booking
        console.log('Attempting to insert booking for service:', testServiceId);

        const locator = nanoid(8).toUpperCase();
        // Parse date and time to Date objects (assuming local time for simplicity in test)
        const startAt = new Date(`${'2026-01-20'}T${'10:00'}:00`);
        const endAt = new Date(startAt.getTime() + 60 * 60 * 1000); // 1 hour duration

        await db.insert(bookings).values({
            id: nanoid(),
            locator,
            serviceId: testServiceId,
            customerName: 'Test User',
            customerEmail: 'test@example.com',
            customerPhone: '123456789',
            date: '2026-01-20',
            startTime: '10:00',
            startAt: startAt,
            endAt: endAt,
            selectedOptions: [], // Array for json mode
            status: 'CONFIRMED',
        });

        console.log('Booking inserted successfully with locator:', locator);

    } catch (e) {
        console.error('INSERT FAILED:', e);
    }

    process.exit(0);
}

main();
