
import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function GET() {
    const dbUrl = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    const finalUrl = dbUrl?.replace("libsql://", "https://");

    try {
        const client = createClient({
            url: finalUrl || "",
            authToken: authToken,
        });

        const rs = await client.execute("SELECT 1;");
        const rs2 = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");

        return NextResponse.json({
            status: "connected",
            originalUrlMasked: dbUrl?.substring(0, 15) + "...",
            usedUrlMasked: finalUrl?.substring(0, 15) + "...",
            tokenPrefix: authToken ? authToken.substring(0, 10) + "..." : "none",
            tables: rs2.rows.map(r => r.name)
        });
    } catch (error) {
        return NextResponse.json({
            status: "error",
            error: error instanceof Error ? error.message : String(error),
            usedUrlMasked: finalUrl?.substring(0, 15) + "...",
            tokenPrefix: authToken ? authToken.substring(0, 10) + "..." : "none",
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}
