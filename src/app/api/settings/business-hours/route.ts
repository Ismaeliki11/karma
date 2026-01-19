
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { businessHours } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { validateScheduleLogic } from '@/lib/validation/schedule';
import { checkScheduleConflicts } from '@/lib/conflicts';

export async function GET() {
    try {
        const hours = await db.select().from(businessHours);

        // Return default if empty
        if (hours.length === 0) {
            const defaults = Array.from({ length: 7 }, (_, i) => ({
                id: `default-${i}`,
                dayOfWeek: i, // 0=Sun, 1=Mon...
                // Default: 10:00-14:00 and 16:00-20:00 Mon-Fri
                // Sat: 10:00-14:00 only
                // Sun: Closed
                morningStart: i === 0 ? null : '10:00',
                morningEnd: i === 0 ? null : '14:00',
                afternoonStart: (i >= 1 && i <= 5) ? '16:00' : null,
                afternoonEnd: (i >= 1 && i <= 5) ? '20:00' : null,
                isClosed: i === 0,
            }));
            return NextResponse.json(defaults);
        }

        return NextResponse.json(hours);
    } catch (error) {
        console.error('API_ERROR [GET /api/settings/business-hours]:', error);
        return NextResponse.json({
            error: 'Failed to fetch settings',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const force = searchParams.get('force') === 'true';
        const body = await request.json();
        const conflictsList = [];

        // 1. Strict Validation of Input Logic
        for (const day of body) {
            if (!day.isClosed) {
                const valid = validateScheduleLogic({
                    isClosed: day.isClosed,
                    morningStart: day.morningStart,
                    morningEnd: day.morningEnd,
                    afternoonStart: day.afternoonStart,
                    afternoonEnd: day.afternoonEnd
                });

                if (!valid.isValid) {
                    return NextResponse.json({
                        error: `Error en ${getDayName(day.dayOfWeek)}: ${valid.error}`
                    }, { status: 400 });
                }
            }
        }

        // 2. Conflict Detection (if not forcing)
        if (!force) {
            for (const day of body) {
                const dayConflicts = await checkScheduleConflicts({
                    dayOfWeek: day.dayOfWeek,
                    isClosed: day.isClosed,
                    morningStart: day.morningStart,
                    morningEnd: day.morningEnd,
                    afternoonStart: day.afternoonStart,
                    afternoonEnd: day.afternoonEnd
                });
                conflictsList.push(...dayConflicts);
            }

            if (conflictsList.length > 0) {
                const uniqueConflicts = Array.from(new Map(conflictsList.map(c => [c.bookingId, c])).values());

                return NextResponse.json({
                    error: 'Se han detectado conflictos con reservas existentes.',
                    conflicts: uniqueConflicts
                }, { status: 409 });
            }
        }

        // 3. Save
        await db.transaction(async (tx) => {
            for (const item of body) {
                const existing = await tx.select().from(businessHours).where(eq(businessHours.dayOfWeek, item.dayOfWeek)).limit(1);

                if (existing.length > 0) {
                    await tx.update(businessHours).set({
                        morningStart: item.morningStart || null,
                        morningEnd: item.morningEnd || null,
                        afternoonStart: item.afternoonStart || null,
                        afternoonEnd: item.afternoonEnd || null,
                        isClosed: item.isClosed
                    }).where(eq(businessHours.dayOfWeek, item.dayOfWeek));
                } else {
                    await tx.insert(businessHours).values({
                        id: nanoid(),
                        dayOfWeek: item.dayOfWeek,
                        morningStart: item.morningStart || null,
                        morningEnd: item.morningEnd || null,
                        afternoonStart: item.afternoonStart || null,
                        afternoonEnd: item.afternoonEnd || null,
                        isClosed: item.isClosed
                    });
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API_ERROR [POST /api/settings/business-hours]:', error);
        return NextResponse.json({
            error: 'Failed to save settings',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

function getDayName(index: number) {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return days[index] || "Día desconocido";
}
