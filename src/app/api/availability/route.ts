import { NextResponse } from 'next/server';
export const runtime = "edge";
import { db } from '@/db';
import { services } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getDailySlots } from '@/lib/availability';
import { parse } from 'date-fns';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get('date');
        const serviceId = searchParams.get('serviceId');

        if (!dateStr || !serviceId) {
            return NextResponse.json({ error: 'Date and Service ID are required' }, { status: 400 });
        }

        // 1. Get Service Duration
        const service = await db.query.services.findFirst({
            where: eq(services.id, serviceId),
        });

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        // 2. Parse Date (Assume YYYY-MM-DD)
        const date = parse(dateStr, 'yyyy-MM-dd', new Date());

        // 3. Get Slots
        const slots = await getDailySlots(date, service.duration);

        return NextResponse.json({ slots });
    } catch (error) {
        console.error('Availability Error:', error);
        return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
    }
}
