
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { availabilityExceptions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { validateScheduleLogic } from '@/lib/validation/schedule';
import { checkScheduleConflicts } from '@/lib/conflicts';

export async function GET() {
    try {
        const exceptions = await db.select().from(availabilityExceptions).orderBy(desc(availabilityExceptions.date));
        return NextResponse.json(exceptions);
    } catch (error) {
        console.error('Error fetching exceptions:', error);
        return NextResponse.json({ error: 'Failed to fetch exceptions' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const force = searchParams.get('force') === 'true';
        const body = await request.json();
        const { date, openTime, closeTime, breakStart, breakEnd, isClosed, reason } = body;

        if (!date) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }

        // 1. Validation Logic
        if (!isClosed) {
            const valid = validateScheduleLogic({
                openTime: openTime || "09:00",
                closeTime: closeTime || "20:00",
                breakStart: breakStart || null,
                breakEnd: breakEnd || null
            });
            if (!valid.isValid) {
                return NextResponse.json({ error: valid.error }, { status: 400 });
            }
        }

        // 2. Conflict Detection
        if (!force) {
            const conflicts = await checkScheduleConflicts({
                date: date,
                isClosed: isClosed,
                openTime: openTime || "09:00",
                closeTime: closeTime || "20:00",
                breakStart: breakStart || null,
                breakEnd: breakEnd || null
            });

            if (conflicts.length > 0) {
                return NextResponse.json({
                    error: 'Schedule conflicts detected',
                    conflicts
                }, { status: 409 });
            }
        }

        // 3. Save
        // Check if exists update, else insert
        const existing = await db.select().from(availabilityExceptions).where(eq(availabilityExceptions.date, date)).limit(1);

        if (existing.length > 0) {
            await db.update(availabilityExceptions).set({
                openTime: openTime || null,
                closeTime: closeTime || null,
                breakStart: breakStart || null,
                breakEnd: breakEnd || null,
                isClosed: isClosed || false,
                reason: reason || null
            }).where(eq(availabilityExceptions.date, date));
        } else {
            await db.insert(availabilityExceptions).values({
                id: nanoid(),
                date,
                openTime: openTime || null,
                closeTime: closeTime || null,
                breakStart: breakStart || null,
                breakEnd: breakEnd || null,
                isClosed: isClosed || false,
                reason: reason || null
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving exception:', error);
        return NextResponse.json({ error: 'Failed to save exception' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        await db.delete(availabilityExceptions).where(eq(availabilityExceptions.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting exception:', error);
        return NextResponse.json({ error: 'Failed to delete exception' }, { status: 500 });
    }
}
