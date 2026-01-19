import { NextResponse } from 'next/server';
import { db } from '@/db';
import { businessHours, availabilityExceptions, bookings } from '@/db/schema';
import { eq, inArray, and, gte, lte, or, not } from 'drizzle-orm';
import { z } from 'zod';
import { MADRID_TZ } from '@/lib/time-utils';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { addMinutes, isAfter, isBefore, parse, format } from 'date-fns';




const scheduleSchema = z.object({
    weekly: z.array(z.object({
        dayOfWeek: z.number().min(0).max(6), // 0=Sun
        morningStart: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
        morningEnd: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
        afternoonStart: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
        afternoonEnd: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
        isClosed: z.boolean(),
    })).optional(),
    exceptions: z.array(z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        morningStart: z.string().nullable().optional(),
        morningEnd: z.string().nullable().optional(),
        afternoonStart: z.string().nullable().optional(),
        afternoonEnd: z.string().nullable().optional(),
        isClosed: z.boolean(),
        reason: z.string().optional()
    })).optional()
});

export async function GET() {
    try {
        const weekly = await db.select().from(businessHours);
        const exceptions = await db.select().from(availabilityExceptions);
        return NextResponse.json({ weekly, exceptions });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = scheduleSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid data', details: result.error }, { status: 400 });
        }

        const { weekly, exceptions } = result.data;

        // CONFLICT DETECTION LOGIC
        const conflicts: any[] = [];

        // 1. Validate Weekly Changes
        if (weekly) {
            const now = new Date();
            const futureBookings = await db.select().from(bookings).where(
                and(
                    gte(bookings.startAt, now),
                    or(eq(bookings.status, 'CONFIRMED'), eq(bookings.status, 'PENDING'))
                )
            );

            for (const daySetting of weekly) {
                const dayBookings = futureBookings.filter(b => {
                    const bDate = toZonedTime(b.startAt, MADRID_TZ);
                    return bDate.getDay() === daySetting.dayOfWeek;
                });

                if (dayBookings.length === 0) continue;

                if (daySetting.isClosed) {
                    conflicts.push(...dayBookings.map(b => ({
                        ...b, reason: `El día ${daySetting.dayOfWeek} ahora está cerrado`
                    })));
                    continue;
                }

                for (const b of dayBookings) {
                    const bDate = toZonedTime(b.startAt, MADRID_TZ);
                    const dateStr = format(bDate, 'yyyy-MM-dd');
                    const bStartMins = bDate.getHours() * 60 + bDate.getMinutes();
                    const bEndWithBuffer = addMinutes(b.endAt, 10);
                    const bEndDate = toZonedTime(bEndWithBuffer, MADRID_TZ);
                    const bEndMins = bEndDate.getHours() * 60 + bEndDate.getMinutes();

                    let fitsInShift = false;
                    const shifts = [];
                    if (daySetting.morningStart && daySetting.morningEnd) {
                        shifts.push({ start: daySetting.morningStart, end: daySetting.morningEnd });
                    }
                    if (daySetting.afternoonStart && daySetting.afternoonEnd) {
                        shifts.push({ start: daySetting.afternoonStart, end: daySetting.afternoonEnd });
                    }

                    for (const shift of shifts) {
                        const [shStartH, shStartM] = shift.start.split(':').map(Number);
                        const [shEndH, shEndM] = shift.end.split(':').map(Number);
                        const shStartMins = shStartH * 60 + shStartM;
                        const shEndMins = shEndH * 60 + shEndM;

                        if (bStartMins >= shStartMins && bEndMins <= shEndMins) {
                            fitsInShift = true;
                            break;
                        }
                    }

                    if (!fitsInShift) {
                        conflicts.push({ ...b, reason: `Fuera del nuevo horario o coincide con el descanso` });
                    }
                }
            }
        }

        // 2. Validate Exceptions
        if (exceptions) {
            for (const exc of exceptions) {
                const dayStart = fromZonedTime(`${exc.date} 00:00`, MADRID_TZ);
                const dayEnd = fromZonedTime(`${exc.date} 23:59`, MADRID_TZ);

                const dayBookings = await db.select().from(bookings).where(
                    and(
                        gte(bookings.startAt, dayStart),
                        lte(bookings.startAt, dayEnd),
                        or(eq(bookings.status, 'CONFIRMED'), eq(bookings.status, 'PENDING'))
                    )
                );

                if (dayBookings.length > 0) {
                    if (exc.isClosed) {
                        conflicts.push(...dayBookings.map(b => ({ ...b, reason: `La fecha ${exc.date} ahora está cerrada` })));
                    } else {
                        for (const b of dayBookings) {
                            const bDate = toZonedTime(b.startAt, MADRID_TZ);
                            const bStartMins = bDate.getHours() * 60 + bDate.getMinutes();
                            const bEndWithBuffer = addMinutes(b.endAt, 10);
                            const bEndDate = toZonedTime(bEndWithBuffer, MADRID_TZ);
                            const bEndMins = bEndDate.getHours() * 60 + bEndDate.getMinutes();

                            let fitsInShift = false;
                            const shifts = [];
                            if (exc.morningStart && exc.morningEnd) {
                                shifts.push({ start: exc.morningStart, end: exc.morningEnd });
                            }
                            if (exc.afternoonStart && exc.afternoonEnd) {
                                shifts.push({ start: exc.afternoonStart, end: exc.afternoonEnd });
                            }

                            for (const shift of shifts) {
                                const [shStartH, shStartM] = shift.start.split(':').map(Number);
                                const [shEndH, shEndM] = shift.end.split(':').map(Number);
                                const shStartMins = shStartH * 60 + shStartM;
                                const shEndMins = shEndH * 60 + shEndM;

                                if (bStartMins >= shStartMins && bEndMins <= shEndMins) {
                                    fitsInShift = true;
                                    break;
                                }
                            }

                            if (!fitsInShift) {
                                conflicts.push({ ...b, reason: `Fuera del nuevo horario de excepción en ${exc.date}` });
                            }
                        }
                    }
                }
            }
        }

        if (conflicts.length > 0) {
            return NextResponse.json({
                error: 'Cannot update schedule due to conflicting bookings',
                conflicts: conflicts.map(c => ({
                    locator: c.locator,
                    customer: c.customerName,
                    date: c.date,
                    time: c.startTime,
                    reason: c.reason
                }))
            }, { status: 409 });
        }

        // 3. Apply Changes if No Conflicts
        await db.transaction(async (tx) => {
            if (weekly) {
                for (const w of weekly) {
                    const { dayOfWeek, ...data } = w;
                    await tx.insert(businessHours).values({
                        id: `dow-${dayOfWeek}`,
                        dayOfWeek,
                        ...data
                    }).onConflictDoUpdate({
                        target: businessHours.dayOfWeek,
                        set: data
                    });
                }
            }

            if (exceptions) {
                for (const e of exceptions) {
                    const { date, ...data } = e;
                    await tx.insert(availabilityExceptions).values({
                        id: `exc-${date}`,
                        startDate: date,
                        endDate: date,
                        ...data
                    }).onConflictDoUpdate({
                        target: availabilityExceptions.startDate, // Assuming startDate is used for single-day conflict for now or match schema
                        set: {
                            startDate: date,
                            endDate: date,
                            ...data
                        }
                    });
                }
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Schedule Update Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
