import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/settings';



export async function GET() {
    try {
        const settings = await getSettings();
        return NextResponse.json(settings.publicNotice);
    } catch (error) {
        console.error('API_ERROR [GET /api/settings/notice]:', error);
        return NextResponse.json({
            error: 'Failed to fetch notice',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const settings = await getSettings();

        settings.publicNotice = {
            active: body.active,
            message: body.message || "",
        };

        await saveSettings(settings);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("API_ERROR [POST /api/settings/notice]:", error);
        return NextResponse.json({
            error: "Failed to save",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
