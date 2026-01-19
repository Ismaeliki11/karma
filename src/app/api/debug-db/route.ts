
import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function GET() {
    const dbUrl = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    try {
        const client = createClient({
            url: dbUrl || "",
            authToken: authToken,
        });

        const rs = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");
        const tables = rs.rows.map(r => r.name);

        return NextResponse.json({
            status: "connected",
            dbUrlMasked: dbUrl?.substring(0, 15) + "...",
            authTokenExists: !!authToken,
            tables: tables
        });
    } catch (error) {
        return NextResponse.json({
            status: "error",
            error: error instanceof Error ? error.message : String(error),
            dbUrlMasked: dbUrl?.substring(0, 15) + "...",
        }, { status: 500 });
    }
}
