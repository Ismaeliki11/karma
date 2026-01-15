
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
    date?: string; // For exception checks YYYY-MM-DD
    openTime: string;
    closeTime: string;
    breakStart?: string | null;
    breakEnd?: string | null;
    isClosed: boolean;
}

/**
 * Checks for conflicts between a proposed schedule change and existing bookings.
 * Can check a recurring weekly change OR a specific date exception.
 */
export async function checkScheduleConflicts(proposal: ProposedSchedule): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = [];

    // 1. Fetch relevant bookings
    let relevantBookings;
    const now = new Date();

    if (proposal.date) {
        // Exception Case: Specific Date
        // Fetch bookings for this specific date
        // Note: bookings stored in UTC/Zoned logic? 
        // Schema usually stores specific timestamps startAt/endAt.
        // We need bookings that FALL on this day in Madrid Time.
        // Simplified approach: Fetch bookings that start on this day string.
        relevantBookings = await db.select().from(bookings).where(
            and(
                eq(bookings.date, proposal.date), // Assuming 'date' column matches YYYY-MM-DD
                ne(bookings.status, 'CANCELLED')
            )
        );
    } else if (proposal.dayOfWeek !== undefined) {
        // Recurring Case: All future bookings on this day of week
        // This is potentially heavy, but necessary for safety.
        // We fetch ALL future active bookings.
        const allFuture = await db.select().from(bookings).where(
            and(
                gte(bookings.startAt, now),
                ne(bookings.status, 'CANCELLED')
            )
        );

        // Filter in memory for correct Day of Week
        relevantBookings = allFuture.filter(b => {
            const bDate = toZonedTime(b.startAt, MADRID_TZ);
            // getDay() 0=Sun, 6=Sat.
            return bDate.getDay() === proposal.dayOfWeek;
        });
    } else {
        throw new Error("Must provide dayOfWeek or date for conflict check");
    }

    if (!relevantBookings || relevantBookings.length === 0) return [];

    // 2. Evaluate Conflicts
    for (const booking of relevantBookings) {
        // If closed, EVERYTHING is a conflict
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

        // Logic Helpers
        const toMinutes = (time: string) => {
            const [h, m] = time.split(':').map(Number);
            return h * 60 + m;
        };

        const bookingStart = toZonedTime(booking.startAt, MADRID_TZ);
        const bookingEnd = toZonedTime(booking.endAt, MADRID_TZ);

        const bStartMins = bookingStart.getHours() * 60 + bookingStart.getMinutes();
        const bEndMins = bookingEnd.getHours() * 60 + bookingEnd.getMinutes();

        const openMins = toMinutes(proposal.openTime);
        const closeMins = toMinutes(proposal.closeTime);

        // Check 1: Out of Bounds
        // Strict: Booking must start >= Open AND End <= Close
        if (bStartMins < openMins || bEndMins > closeMins) {
            conflicts.push({
                bookingId: booking.id,
                customerName: booking.customerName,
                date: booking.date,
                time: booking.startTime,
                reason: `Fuera de nuevo horario (${proposal.openTime} - ${proposal.closeTime})`
            });
            continue;
        }

        // Check 2: Break Overlap
        if (proposal.breakStart && proposal.breakEnd) {
            const breakStartMins = toMinutes(proposal.breakStart);
            const breakEndMins = toMinutes(proposal.breakEnd);

            // Overlap: (StartA < EndB) and (EndA > StartB)
            if (bStartMins < breakEndMins && bEndMins > breakStartMins) {
                conflicts.push({
                    bookingId: booking.id,
                    customerName: booking.customerName,
                    date: booking.date,
                    time: booking.startTime,
                    reason: `Coincide con descanso (${proposal.breakStart} - ${proposal.breakEnd})`
                });
            }
        }
    }

    return conflicts;
}

// Helper needed because 'eq' wasn't imported from drizzle in top scope for the 'if' block
import { eq } from 'drizzle-orm';
