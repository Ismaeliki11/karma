import { NextResponse } from 'next/server';
import { getMonthAvailability } from '@/lib/availability';

export const runtime = "edge";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get('year') || '');
        const month = parseInt(searchParams.get('month') || '');

        if (isNaN(year) || isNaN(month)) {
            return NextResponse.json({ error: 'Year and Month are required' }, { status: 400 });
        }

        const data = await getMonthAvailability(year, month);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Month Availability Error:', error);
        return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
    }
}
