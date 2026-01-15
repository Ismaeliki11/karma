
import { db } from './src/db/index';
import { services, bookings } from './src/db/schema';
import fs from 'fs';

async function debugData() {
    try {
        const allServices = await db.select().from(services);
        const validIds = new Set(allServices.map(s => s.id));

        const allBookings = await db.select().from(bookings);

        let output = 'Active Services:\n' + allServices.map(s => `- ${s.id}`).join('\n') + '\n\n';
        output += 'Bookings Check:\n';

        allBookings.forEach(b => {
            const isValid = validIds.has(b.serviceId || '');
            if (!isValid) {
                output += `[INVALID] Booking ID: ${b.id}, ServiceID: '${b.serviceId}' (NOT FOUND in Services)\n`;
            } else {
                output += `[OK] Booking ID: ${b.id}, ServiceID: '${b.serviceId}'\n`;
            }
        });

        fs.writeFileSync('temp_bookings_output.txt', output);
        console.log('Written to temp_bookings_output.txt');
    } catch (err) {
        console.error(err);
        fs.writeFileSync('temp_bookings_output.txt', 'Error: ' + err);
    }
}

debugData();
