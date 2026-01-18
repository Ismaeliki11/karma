import { NextResponse } from 'next/server';
import { db } from '@/db';
import { businessHours } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { validateScheduleLogic } from '@/lib/validation/schedule';
import { checkScheduleConflicts } from '@/lib/conflicts';

export const runtime = "edge";

export async function GET() {
    try {
        const hours = await db.select().from(businessHours);

        // Return default if empty
        if (hours.length === 0) {
            const defaults = Array.from({ length: 7 }, (_, i) => ({
                id: `default-${i}`,
                dayOfWeek: i, // 0=Sun, 1=Mon...
                openTime: '09:00', // Default string
                closeTime: '20:00',
                breakStart: '14:00',
                breakEnd: '16:00',
                isClosed: i === 0 || i === 6, // Closed weekends by default
            }));
            return NextResponse.json(defaults);
        }

        return NextResponse.json(hours);
    } catch (error) {
        console.error('Error fetching business hours:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
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
                    openTime: day.openTime,
                    closeTime: day.closeTime,
                    breakStart: day.breakStart,
                    breakEnd: day.breakEnd
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
                    openTime: day.openTime,
                    closeTime: day.closeTime,
                    breakStart: day.breakStart,
                    breakEnd: day.breakEnd
                });
                conflictsList.push(...dayConflicts);
            }

            if (conflictsList.length > 0) {
                // Deduplicate by booking ID (recurring schedule might hit same booking multiple times if logic was flawed, 
                // but checking day-by-day is safe. Booking only happens once.
                // However, safe to be sure.)
                const uniqueConflicts = Array.from(new Map(conflictsList.map(c => [c.bookingId, c])).values());

                return NextResponse.json({
                    error: 'Schedule conflicts detected',
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
                        openTime: item.openTime,
                        closeTime: item.closeTime,
                        breakStart: item.breakStart || null,
                        breakEnd: item.breakEnd || null,
                        isClosed: item.isClosed
                    }).where(eq(businessHours.dayOfWeek, item.dayOfWeek));
                } else {
                    await tx.insert(businessHours).values({
                        id: nanoid(),
                        dayOfWeek: item.dayOfWeek,
                        openTime: item.openTime,
                        closeTime: item.closeTime,
                        breakStart: item.breakStart || null,
                        breakEnd: item.breakEnd || null,
                        isClosed: item.isClosed
                    });
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving business hours:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}

function getDayName(index: number) {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return days[index] || "Día desconocido";
}
