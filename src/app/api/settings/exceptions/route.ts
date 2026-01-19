import { NextResponse } from 'next/server';
import { db } from '@/db';
import { availabilityExceptions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { validateScheduleLogic } from '@/lib/validation/schedule';
import { checkScheduleConflicts } from '@/lib/conflicts';

export async function GET() {
    try {
        const exceptions = await db.select().from(availabilityExceptions).orderBy(desc(availabilityExceptions.startDate));
        return NextResponse.json(exceptions);
    } catch (error) {
        console.error('API_ERROR [GET /api/settings/exceptions]:', error);
        return NextResponse.json({
            error: 'Failed to fetch exceptions',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const force = searchParams.get('force') === 'true';
        const body = await request.json();
        const { startDate, endDate, morningStart, morningEnd, afternoonStart, afternoonEnd, isClosed, reason } = body;

        if (!startDate || !endDate) {
            return NextResponse.json({ error: 'Start Date and End Date are required' }, { status: 400 });
        }

        if (startDate > endDate) {
            return NextResponse.json({ error: 'La fecha de inicio no puede ser posterior a la fecha de fin.' }, { status: 400 });
        }

        // 1. Validation Logic
        if (!isClosed) {
            const valid = validateScheduleLogic({
                isClosed: false,
                morningStart: morningStart,
                morningEnd: morningEnd,
                afternoonStart: afternoonStart,
                afternoonEnd: afternoonEnd
            });
            if (!valid.isValid) {
                return NextResponse.json({ error: valid.error }, { status: 400 });
            }
        }

        // 2. Conflict Detection
        // Only check conflicts if we are NOT forcing, and we have reasonable input
        if (!force) {
            const conflicts = await checkScheduleConflicts({
                range: { start: startDate, end: endDate },
                isClosed: isClosed || false,
                morningStart: morningStart,
                morningEnd: morningEnd,
                afternoonStart: afternoonStart,
                afternoonEnd: afternoonEnd
            });

            if (conflicts.length > 0) {
                return NextResponse.json({
                    error: 'Se han detectado conflictos con reservas existentes.',
                    conflicts
                }, { status: 409 });
            }
        }

        // 3. Save
        // For ranges, we treat every entry as a new "Exception Rule" in database?
        // Or do we overwrite overlapping dates?
        // Schema: startDate, endDate.
        // Simplified: Just insert new rule. Conflicts in RULES (overlapping exceptions) are not strictly blocked by DB, 
        // but Logic uses "first match" or latest?
        // Let's assume user manages overlap visually.
        // But better: Check if exact date range exists? Or just always INSERT new ID.
        // If we want to EDIT, we need ID.
        // For new: always insert.

        await db.insert(availabilityExceptions).values({
            id: nanoid(),
            startDate,
            endDate,
            morningStart: morningStart || null,
            morningEnd: morningEnd || null,
            afternoonStart: afternoonStart || null,
            afternoonEnd: afternoonEnd || null,
            isClosed: isClosed || false,
            reason: reason || null
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API_ERROR [POST /api/settings/exceptions]:', error);
        return NextResponse.json({
            error: 'Failed to save exception',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
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
