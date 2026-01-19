
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { and, ne, gte, lte, or } from 'drizzle-orm';
import { parse, addMinutes, isBefore, isAfter, isEqual } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { MADRID_TZ } from '@/lib/time-utils';

export interface ScheduleConflict {
    bookingId: string;
    customerName: string;
    date: string;
    time: string;
    reason: string;
}

export interface ProposedSchedule {
    dayOfWeek?: number; // For recurring checks
    date?: string; // For exception checks YYYY-MM-DD (Exact Date)
    range?: { start: string, end: string }; // For Range Exceptions
    morningStart?: string | null;
    morningEnd?: string | null;
    afternoonStart?: string | null;
    afternoonEnd?: string | null;
    isClosed: boolean;
}

/**
 * Checks for conflicts between a proposed schedule change and existing bookings.
 */
export async function checkScheduleConflicts(proposal: ProposedSchedule): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = [];
    const now = new Date();

    // 1. Fetch relevant bookings
    let relevantBookings;

    if (proposal.date) {
        // Single Date Exception
        relevantBookings = await db.select().from(bookings).where(
            and(
                eq(bookings.date, proposal.date),
                ne(bookings.status, 'CANCELLED')
            )
        );
    } else if (proposal.range) {
        // Range Exception
        relevantBookings = await db.select().from(bookings).where(
            and(
                gte(bookings.date, proposal.range.start),
                lte(bookings.date, proposal.range.end),
                ne(bookings.status, 'CANCELLED')
            )
        );
    } else if (proposal.dayOfWeek !== undefined) {
        // Recurring Weekly
        const allFuture = await db.select().from(bookings).where(
            and(
                gte(bookings.startAt, now),
                ne(bookings.status, 'CANCELLED')
            )
        );
        relevantBookings = allFuture.filter(b => {
            const bDate = toZonedTime(b.startAt, MADRID_TZ);
            return bDate.getDay() === proposal.dayOfWeek;
        });
    } else {
        throw new Error("Invalid proposal scope");
    }

    if (!relevantBookings || relevantBookings.length === 0) return [];

    // 2. Evaluate Conflicts
    for (const booking of relevantBookings) {
        // If closed, everything is a conflict
        if (proposal.isClosed) {
            conflicts.push({
                bookingId: booking.id,
                customerName: booking.customerName,
                date: booking.date,
                time: booking.startTime,
                reason: "El día pasa a estar cerrado."
            });
            continue;
        }

        const toMinutes = (time: string) => {
            const [h, m] = time.split(':').map(Number);
            return h * 60 + m;
        };

        const bookingStart = toZonedTime(booking.startAt, MADRID_TZ);
        const bookingEnd = toZonedTime(booking.endAt, MADRID_TZ);

        const bStartMins = bookingStart.getHours() * 60 + bookingStart.getMinutes();
        const bEndMins = bookingEnd.getHours() * 60 + bookingEnd.getMinutes();

        // Check if booking fits in ANY valid shift
        let fits = false;

        // Morning
        if (proposal.morningStart && proposal.morningEnd) {
            const mStart = toMinutes(proposal.morningStart);
            const mEnd = toMinutes(proposal.morningEnd);
            // Must be fully contained: mStart <= bStart AND bEnd <= mEnd
            if (bStartMins >= mStart && bEndMins <= mEnd) {
                fits = true;
            }
        }

        // Afternoon (if not already fit in morning)
        if (!fits && proposal.afternoonStart && proposal.afternoonEnd) {
            const aStart = toMinutes(proposal.afternoonStart);
            const aEnd = toMinutes(proposal.afternoonEnd);
            if (bStartMins >= aStart && bEndMins <= aEnd) {
                fits = true;
            }
        }

        if (!fits) {
            conflicts.push({
                bookingId: booking.id,
                customerName: booking.customerName,
                date: booking.date,
                time: booking.startTime,
                reason: `Fuera del nuevo horario.`
            });
        }
    }

    return conflicts;
}

// Helper needed because 'eq' wasn't imported from drizzle in top scope for the 'if' block
import { eq } from 'drizzle-orm';
