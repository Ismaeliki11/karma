import { NextResponse } from 'next/server';
import { db } from '@/db';
import { businessHours, availabilityExceptions, bookings } from '@/db/schema';
import { eq, inArray, and, gte, lte, or, not } from 'drizzle-orm';
import { z } from 'zod';
import { MADRID_TZ } from '@/lib/time-utils';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { addMinutes, isAfter, isBefore, parse } from 'date-fns';

export const runtime = "edge";

const scheduleSchema = z.object({
    weekly: z.array(z.object({
        dayOfWeek: z.number().min(0).max(6), // 0=Sun
        openTime: z.string().regex(/^\d{2}:\d{2}$/),
        closeTime: z.string().regex(/^\d{2}:\d{2}$/),
        breakStart: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
        breakEnd: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
        isClosed: z.boolean(),
    })).optional(),
    exceptions: z.array(z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        openTime: z.string().optional(),
        closeTime: z.string().optional(),
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
            // Fetch all future bookings? Or just check against simplified rule?
            // "Validaciones obligatorias... indicar que no se puede aplicar el cambio hasta cancelar"
            // We need to check if ANY future booking becomes invalid under new rules.
            // This is heavy if we check ALL bookings.
            // Optimization: Only check bookings for the specific dayOfWeek that is changing to be MORE restrictive.
            // Simplification: Fetch all future bookings (from today). Check each against the new weekly rule.

            // Get all future bookings
            const now = new Date();
            const futureBookings = await db.select().from(bookings).where(
                and(
                    gte(bookings.startAt, now),
                    or(eq(bookings.status, 'CONFIRMED'), eq(bookings.status, 'PENDING'))
                )
            );

            for (const daySetting of weekly) {
                // Find bookings for this day of week
                const dayBookings = futureBookings.filter(b => {
                    const bDate = toZonedTime(b.startAt, MADRID_TZ);
                    return bDate.getDay() === daySetting.dayOfWeek;
                });

                if (dayBookings.length === 0) continue;

                if (daySetting.isClosed) {
                    conflicts.push(...dayBookings.map(b => ({
                        ...b, reason: `Day ${daySetting.dayOfWeek} is now closed`
                    })));
                    continue;
                }

                // Check Open/Close boundaries
                // We need to compare HH:MM strings vs booking times in HH:MM
                for (const b of dayBookings) {
                    const bDate = toZonedTime(b.startAt, MADRID_TZ);
                    // Check exclusion logic
                    // If bStart < NewOpen OR bEndWithBuffer > NewClose
                    // OR intersects NewBreak
                    // Re-use logic? Hard to reuse exactly without constructing Dates.
                    // Manual check:

                    // Helper to get minutes from midnight
                    const getMins = (d: Date) => d.getHours() * 60 + d.getMinutes();
                    const parseMins = (t: string) => parseInt(t.split(':')[0]) * 60 + parseInt(t.split(':')[1]);

                    const bStartMins = getMins(bDate);
                    // bEnd is b.endAt. Buffer is logical.
                    // "No se permite que... end_at + cortesía sobrepase..."
                    const bEndWithBuffer = addMinutes(b.endAt, 10);
                    const bEndMins = getMins(toZonedTime(bEndWithBuffer, MADRID_TZ));

                    const newOpen = parseMins(daySetting.openTime);
                    const newClose = parseMins(daySetting.closeTime);

                    if (bStartMins < newOpen || bEndMins > newClose) {
                        conflicts.push({ ...b, reason: `Outside new hours (${daySetting.openTime}-${daySetting.closeTime})` });
                    }

                    if (daySetting.breakStart && daySetting.breakEnd) {
                        const breakStart = parseMins(daySetting.breakStart);
                        const breakEnd = parseMins(daySetting.breakEnd);
                        // Overlap: Start < BreakEnd && End > BreakStart
                        if (bStartMins < breakEnd && bEndMins > breakStart) {
                            conflicts.push({ ...b, reason: `Conflicts with new break (${daySetting.breakStart}-${daySetting.breakEnd})` });
                        }
                    }
                }
            }
        }

        // 2. Validate Exceptions
        if (exceptions) {
            const now = new Date();

            for (const exc of exceptions) {
                // Check bookings for this specific date
                // exc.date is YYYY-MM-DD
                // Fetch bookings for this date
                // We can query DB for this specific date range to be efficient
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
                        conflicts.push(...dayBookings.map(b => ({ ...b, reason: `Date ${exc.date} is now closed` })));
                    } else if (exc.openTime && exc.closeTime) {
                        // Check boundaries similar to above
                        const getMins = (d: Date) => d.getHours() * 60 + d.getMinutes();
                        const parseMins = (t: string) => parseInt(t.split(':')[0]) * 60 + parseInt(t.split(':')[1]);

                        const newOpen = parseMins(exc.openTime);
                        const newClose = parseMins(exc.closeTime);

                        for (const b of dayBookings) {
                            const bDate = toZonedTime(b.startAt, MADRID_TZ);
                            const bStartMins = getMins(bDate);
                            const bEndWithBuffer = addMinutes(b.endAt, 10);
                            const bEndMins = getMins(toZonedTime(bEndWithBuffer, MADRID_TZ));

                            if (bStartMins < newOpen || bEndMins > newClose) {
                                conflicts.push({ ...b, reason: `Outside exception hours on ${exc.date}` });
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
                    await tx.insert(businessHours).values({
                        id: `dow-${w.dayOfWeek}`,
                        ...w
                    }).onConflictDoUpdate({
                        target: businessHours.dayOfWeek,
                        set: w
                    });
                }
            }

            if (exceptions) {
                for (const e of exceptions) {
                    await tx.insert(availabilityExceptions).values({
                        id: `exc-${e.date}`,
                        ...e
                    }).onConflictDoUpdate({
                        target: availabilityExceptions.date,
                        set: e
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
