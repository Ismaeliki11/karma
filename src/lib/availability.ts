import { db } from '@/db';
import { bookings, businessHours, availabilityExceptions } from '@/db/schema';
import { eq, and, lte, gte, or } from 'drizzle-orm';
import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import { addMinutes, parse, isBefore, isAfter, isEqual, endOfMonth, eachDayOfInterval, startOfDay } from 'date-fns';
import { MADRID_TZ, getMadridDateString } from './time-utils';

// Types
export interface Shift {
    start: string; // HH:mm
    end: string; // HH:mm
}

export interface DaySchedule {
    morning: Shift | null;
    afternoon: Shift | null;
    isClosed: boolean;
}

/**
 * Get effective business hours for a specific date (Europe/Madrid).
 * Merges weekly schedule with exceptions.
 */
export async function getBusinessBoundaries(date: Date): Promise<DaySchedule | null> {
    const dateStr = getMadridDateString(date);
    // 0=Sun, 1=Mon...
    const isoDay = parseInt(format(toZonedTime(date, MADRID_TZ), 'i', { timeZone: MADRID_TZ }));
    const dayOfWeek = isoDay % 7;

    // 1. Check Exceptions (Range or Specific Date)
    // We need to check if 'dateStr' falls within any startDate <= dateStr <= endDate
    // Since we don't have SQL 'BETWEEN' easily with text dates without casting, and format is YYYY-MM-DD which sorts lexically:
    const exception = await db.query.availabilityExceptions.findFirst({
        where: and(
            lte(availabilityExceptions.startDate, dateStr),
            gte(availabilityExceptions.endDate, dateStr)
        )
    });

    if (exception) {
        if (exception.isClosed) return { morning: null, afternoon: null, isClosed: true };

        return {
            morning: (exception.morningStart && exception.morningEnd) ? { start: exception.morningStart, end: exception.morningEnd } : null,
            afternoon: (exception.afternoonStart && exception.afternoonEnd) ? { start: exception.afternoonStart, end: exception.afternoonEnd } : null,
            isClosed: false
        };
    }

    // 2. Check Standard Weekly Schedule
    const schedule = await db.query.businessHours.findFirst({
        where: eq(businessHours.dayOfWeek, dayOfWeek),
    });

    if (!schedule || schedule.isClosed) return { morning: null, afternoon: null, isClosed: true };

    return {
        morning: (schedule.morningStart && schedule.morningEnd) ? { start: schedule.morningStart, end: schedule.morningEnd } : null,
        afternoon: (schedule.afternoonStart && schedule.afternoonEnd) ? { start: schedule.afternoonStart, end: schedule.afternoonEnd } : null,
        isClosed: false,
    };
}

/**
 * Get availability status for a whole month
 */
export async function getMonthAvailability(year: number, month: number): Promise<Record<string, { isOpen: boolean, reason?: string }>> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = endOfMonth(startDate);
    const result: Record<string, { isOpen: boolean, reason?: string }> = {};

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Optimization: Fetch all exceptions possibly overlapping this month
    const startStr = getMadridDateString(startDate);
    const endStr = getMadridDateString(endDate);

    const exceptions = await db.query.availabilityExceptions.findMany({
        where: or(
            and(lte(availabilityExceptions.startDate, endStr), gte(availabilityExceptions.endDate, startStr))
        )
    });

    // Optimization: Fetch weekly schedule once
    const weeklySchedule = await db.query.businessHours.findMany();
    const weeklyMap = new Map(weeklySchedule.map(h => [h.dayOfWeek, h]));

    for (const day of days) {
        const dateStr = getMadridDateString(day);
        const isoDay = parseInt(format(toZonedTime(day, MADRID_TZ), 'i', { timeZone: MADRID_TZ }));
        const dayOfWeek = isoDay % 7;

        let isOpen = false;
        let reason = undefined;

        // 1. Check Exceptions
        // Find specific exception for this day
        const ex = exceptions.find(e => e.startDate <= dateStr && e.endDate >= dateStr);

        if (ex) {
            isOpen = !ex.isClosed;
            // Check if open but no shifts defined? (Shouldn't happen if validated, but safety)
            if (isOpen && !ex.morningStart && !ex.afternoonStart) isOpen = false;

            if (!isOpen) reason = ex.reason || "Cerrado (Excepción)";
        } else {
            // 2. Check Weekly
            const rule = weeklyMap.get(dayOfWeek);
            if (rule && !rule.isClosed) {
                // Check if any shift exists
                if ((rule.morningStart && rule.morningEnd) || (rule.afternoonStart && rule.afternoonEnd)) {
                    isOpen = true;
                } else {
                    isOpen = false;
                    reason = "Cerrado";
                }
            } else {
                reason = "Cerrado";
            }
        }

        // Don't allow past days
        if (isBefore(day, startOfDay(new Date()))) {
            isOpen = false;
            reason = "Pasado";
        }

        result[dateStr] = { isOpen, reason };
    }

    return result;
}

/**
 * Core logic to generate available slots.
 */
export async function getDailySlots(date: Date, serviceDurationMinutes: number): Promise<string[]> {
    const rules = await getBusinessBoundaries(date);
    if (!rules || rules.isClosed) return [];

    const candidates: Date[] = [];

    // Helper to parse "HH:mm" on `date` to UTC Date
    const parseTime = (timeStr: string) => {
        const dStr = getMadridDateString(date);
        return fromZonedTime(`${dStr} ${timeStr}`, MADRID_TZ);
    };

    // Calculate Bounds for Morning and Afternoon
    const periods: { start: Date, end: Date }[] = [];
    if (rules.morning) {
        periods.push({ start: parseTime(rules.morning.start), end: parseTime(rules.morning.end) });
    }
    if (rules.afternoon) {
        periods.push({ start: parseTime(rules.afternoon.start), end: parseTime(rules.afternoon.end) });
    }

    if (periods.length === 0) return []; // No shifts

    // Fetch Bookings for the whole day (simplified range covering all periods)
    // Min start of first period, Max end of last period
    const dayStart = periods[0].start;
    const dayEnd = periods[periods.length - 1].end;

    const dayBookings = await db.select({
        startAt: bookings.startAt,
        endAt: bookings.endAt,
    }).from(bookings).where(
        and(
            gte(bookings.endAt, dayStart),
            lte(bookings.startAt, dayEnd),
            or(eq(bookings.status, 'CONFIRMED'), eq(bookings.status, 'PENDING'))
        )
    );

    // --- CANDIDATE GENERATION PER PERIOD ---
    for (const period of periods) {
        const pStart = period.start;
        const pEnd = period.end;

        // 1. Standard 30m Grid within period
        let t = pStart;
        while (isBefore(t, pEnd)) {
            // Strict inequality? If closes at 14:00, can we start at 14:00? No. 
            // Can we start at 13:30 (30m service)? Yes.
            // Check handled in validation (Start + Duration <= End).
            candidates.push(t);
            t = addMinutes(t, 30);
        }

        // 2. Gap Fillers (Dynamic Slots)
        for (const b of dayBookings) {
            const potentialSlot = addMinutes(b.endAt, 10); // 10 min courtesy/buffer
            if (isAfter(potentialSlot, pStart) && isBefore(potentialSlot, pEnd)) {
                candidates.push(potentialSlot);
            }
        }
    }

    // --- DEDUPLICATION & SORTING ---
    const uniqueCandidates = Array.from(new Set(candidates.map(d => d.getTime())))
        .sort((a, b) => a - b)
        .map(time => new Date(time));

    // --- VALIDATION PIPELINE ---
    const validSlots: string[] = [];

    for (const candidate of uniqueCandidates) {
        const candidateEnd = addMinutes(candidate, serviceDurationMinutes);
        const candidateEndWithBuffer = addMinutes(candidateEnd, 10);

        let isValid = false; // Assume invalid unless it fits in a period strictly

        // 1. Boundaries Check (Must fit entirely within ONE of the periods)
        for (const period of periods) {
            // Must start >= Period Start AND End+Buffer <= Period End
            // Actually Buffer is "after" the service. Does the buffer need to be within business hours?
            // Usually yes, if we say "we close at 14:00", we want to be done by 14:00. 
            // If we have a 10m clean up buffer, maybe that can be after 14:00? 
            // Let's be strict: everything within hours.
            if ((isAfter(candidate, period.start) || isEqual(candidate, period.start)) &&
                (isBefore(candidateEndWithBuffer, period.end) || isEqual(candidateEndWithBuffer, period.end))) {
                isValid = true;
                break;
            }
        }

        if (!isValid) continue;

        // 2. Existing Bookings Intersection
        for (const b of dayBookings) {
            const bEndWithBuffer = addMinutes(b.endAt, 10);

            // Overlap Logic:
            // New Booking Interval: [Candidate, CandidateEnd + 10]
            // Existing Booking Interval (Blocking): [b.Start, b.End + 10]
            // We want NO overlap.

            // Overlap if (StartA < EndB) and (EndA > StartB)

            // Check Intersection
            if (isBefore(candidate, bEndWithBuffer) && isAfter(candidateEndWithBuffer, b.startAt)) {
                isValid = false;
                break;
            }
        }

        // 3. Past time check
        if (isValid && isBefore(candidate, new Date())) {
            isValid = false;
        }

        if (isValid) {
            validSlots.push(format(toZonedTime(candidate, MADRID_TZ), 'HH:mm', { timeZone: MADRID_TZ }));
        }
    }

    return validSlots;
}

function isValidCandidateStart(current: Date, close: Date, duration: number) {
    // Basic optimization: if start + duration > close, stop generating
    return isBefore(addMinutes(current, duration), close) || isEqual(addMinutes(current, duration), close);
}
