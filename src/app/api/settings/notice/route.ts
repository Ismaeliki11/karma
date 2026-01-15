import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/settings';

export async function GET() {
    const settings = await getSettings();
    return NextResponse.json(settings.publicNotice);
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
        console.error("Error saving notice:", error);
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
}
