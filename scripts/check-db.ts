import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function check() {
    try {
        const res = await client.execute("SELECT * FROM business_hours LIMIT 1");
        console.log("Business Hours columns:", res.columns);
        const res2 = await client.execute("SELECT * FROM availability_exceptions LIMIT 1");
        console.log("Exceptions columns:", res2.columns);
        console.log("Check finished successfully.");
    } catch (e: any) {
        console.error("Check failed:", e.message);
    }
}

check().catch(console.error);
