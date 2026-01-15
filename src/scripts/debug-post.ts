
import { nanoid } from 'nanoid';
// We need to fetch from localhost:3000
// We can use the native fetch if Node version supports it (Node 18+) or assume 'tsx' handles it.

async function debugPost() {
    console.log("Sending debug POST...");

    // Construct valid payload
    const payload = {
        serviceId: "invalid-id-12345",
        serviceName: "Debug Service",
        // Let's check DB for a valid service ID first if possible?
        // Actually, let's query the DB for the first service ID to be safe.
        // But we want to test the API.
        // Assuming "manicura-tradicional" might fail if not seeded.
        // Use a known ID if possible or fetch one.
        // Let's fetch one from DB directly in this script to be sure.


        selectedOptions: [],
        date: "2026-01-14",
        time: "15:00",
        customer: {
            name: "Debug User",
            email: "debug@example.com",
            phone: "000000000"
        }
    };

    // Need to get a real service ID
    /*
    const { db } = await import('@/db');
    const service = await db.query.services.findFirst();
    if (!service) {
        console.error("No service found in DB");
        return;
    }
    payload.serviceId = service.id;
    console.log(`Using Service ID: ${service.id}`);
    */

    try {
        const res = await fetch('http://localhost:3001/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log("Raw Body:", text);

        try {
            const json = JSON.parse(text);
            console.log("Parsed JSON:", json);
        } catch (e) {
            console.log("Body is NOT JSON");
        }

    } catch (e) {
        console.error("Network Error:", e);
    }
}

debugPost();
