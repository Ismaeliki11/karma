
import { db } from './src/db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';

async function checkSchema() {
    let output = "";
    try {
        output += "--- availability_exceptions ---\n";
        const columns = await db.run(sql`PRAGMA table_info(availability_exceptions)`);
        const rows = columns.rows || columns;
        if (Array.isArray(rows)) {
            rows.forEach((c: any) => output += `${c.name} (${c.type})\n`);
        }

        output += "\n--- bookings ---\n";
        const bookingsColumns = await db.run(sql`PRAGMA table_info(bookings)`);
        const bRows = bookingsColumns.rows || bookingsColumns;
        if (Array.isArray(bRows)) {
            bRows.forEach((c: any) => output += `${c.name} (${c.type})\n`);
        }

        output += "\n--- business_hours ---\n";
        const bhColumns = await db.run(sql`PRAGMA table_info(business_hours)`);
        const bhRows = bhColumns.rows || bhColumns;
        if (Array.isArray(bhRows)) {
            bhRows.forEach((c: any) => output += `${c.name} (${c.type})\n`);
        }

        fs.writeFileSync('schema_check.txt', output);
        console.log("Results written to schema_check.txt");
    } catch (error) {
        console.error("Error checking schema:", error);
    }
}

checkSchema();
