
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

        const rs = await client.execute("SELECT 1;");
        const rs2 = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");

        return NextResponse.json({
            status: "connected",
            dbUrlMasked: dbUrl?.substring(0, 15) + "...",
            protocol: dbUrl?.split(":")[0],
            authTokenExists: !!authToken,
            selectOne: rs.rows[0],
            tables: rs2.rows.map(r => r.name)
        });
    } catch (error) {
        return NextResponse.json({
            status: "error",
            error: error instanceof Error ? error.message : String(error),
            dbUrlMasked: dbUrl?.substring(0, 15) + "...",
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}
