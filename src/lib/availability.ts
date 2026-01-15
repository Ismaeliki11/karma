import { db } from '@/db';
import { bookings, businessHours, availabilityExceptions } from '@/db/schema';
import { eq, and, lte, gte, or } from 'drizzle-orm';
import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import { addMinutes, parse, isBefore, isAfter, isEqual, endOfMonth, eachDayOfInterval, startOfDay } from 'date-fns';
import { MADRID_TZ, getMadridDateString } from './time-utils';

// Types
export interface TimeSlot {
    start: string; // HH:mm
    available: boolean;
}

export interface DaySchedule {
    openTime: string;
    closeTime: string;
    breakStart?: string | null;
    breakEnd?: string | null;
    isClosed: boolean;
}

/**
 * Get effective business hours for a specific date (Europe/Madrid).
 * Merges weekly schedule with exceptions.
 */
export async function getBusinessBoundaries(date: Date): Promise<DaySchedule | null> {
    const dateStr = getMadridDateString(date);
    // Use explicit timezone format to get day of week (0-6)
    // 'i' returns ISO day of week (1-7, Mon-Sun). We want 0-6 (Sun-Sat).
    // Actually getDay() is 0 (Sun) - 6 (Sat).
    // 'e' formatting token is local day of week (1-indexed usually? check docs).
    // Safe bet: 'e' with locale? Or just cast.
    // Let's use 'i' (ISO): 1=Mon, 7=Sun.
    // Map to 0-6: (i % 7). 7%7=0 (Sun), 1%7=1 (Mon).
    const isoDay = parseInt(format(toZonedTime(date, MADRID_TZ), 'i', { timeZone: MADRID_TZ }));
    const dayOfWeek = isoDay % 7;

    // 1. Check Exceptions
    const exception = await db.query.availabilityExceptions.findFirst({
        where: eq(availabilityExceptions.date, dateStr),
    });

    if (exception) {
        if (exception.isClosed) return null;

        // Exceptions override standard hours
        if (exception.openTime && exception.closeTime) {
            return {
                openTime: exception.openTime,
                closeTime: exception.closeTime,
                isClosed: false,
                breakStart: exception.breakStart || null,
                breakEnd: exception.breakEnd || null
            };
        }
    }

    // 2. Check Standard Weekly Schedule
    const schedule = await db.query.businessHours.findFirst({
        where: eq(businessHours.dayOfWeek, dayOfWeek),
    });

    if (!schedule || schedule.isClosed) return null;

    return {
        openTime: schedule.openTime,
        closeTime: schedule.closeTime,
        // ENFORCE DEFAULT BREAKS: If undefined, use 14:00-16:00. 
        // User Requirement: "Por defecto siempre debe de estar puesto de 2 a 4".
        breakStart: schedule.breakStart || "14:00",
        breakEnd: schedule.breakEnd || "16:00",
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

    // Optimization: Fetch all exceptions for this month at once
    const startStr = getMadridDateString(startDate);
    const endStr = getMadridDateString(endDate);

    const exceptions = await db.query.availabilityExceptions.findMany({
        where: and(
            gte(availabilityExceptions.date, startStr),
            lte(availabilityExceptions.date, endStr)
        )
    });

    const exceptionsMap = new Map(exceptions.map(e => [e.date, e]));

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
        const ex = exceptionsMap.get(dateStr);
        if (ex) {
            isOpen = !ex.isClosed;
            if (ex.isClosed) reason = ex.reason || "Cerrado por festivo";
        } else {
            // 2. Check Weekly
            const rule = weeklyMap.get(dayOfWeek);
            if (rule && !rule.isClosed) {
                isOpen = true;
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
    if (!rules) return [];

    // Helper to parse "HH:mm" on `date` to UTC Date
    const parseTime = (timeStr: string) => {
        const dStr = getMadridDateString(date);
        return fromZonedTime(`${dStr} ${timeStr}`, MADRID_TZ);
    };

    const openAt = parseTime(rules.openTime);
    const closeAt = parseTime(rules.closeTime);

    // Break intervals
    let breakStart: Date | null = null;
    let breakEnd: Date | null = null;
    const bStartStr = rules.breakStart || "14:00";
    const bEndStr = rules.breakEnd || "16:00"; // Default default

    if (rules.breakStart && rules.breakEnd) { // Only if explicitly set or we want to enforce defaults always?
        // User requested: "Por defecto siempre debe de estar puesto de 2 a 4"
        // In getBusinessBoundaries we already default to 14:00-16:00 if missing.
        // So we can trust rules.breakStart/End if they exist.
        breakStart = parseTime(rules.breakStart);
        breakEnd = parseTime(rules.breakEnd);
    } else if (!rules.breakStart && !rules.breakEnd) {
        // Fallback if somehow getBusinessBoundaries didn't catch it, though it should.
        breakStart = parseTime("14:00");
        breakEnd = parseTime("16:00");
    }

    // Fetch Existing Bookings
    const dayBookings = await db.select({
        startAt: bookings.startAt,
        endAt: bookings.endAt,
    }).from(bookings).where(
        and(
            gte(bookings.endAt, openAt),
            lte(bookings.startAt, closeAt),
            or(eq(bookings.status, 'CONFIRMED'), eq(bookings.status, 'PENDING'))
        )
    );

    // --- CANDIDATE GENERATION ---
    const candidates: Date[] = [];

    // 1. Standard 30m Grid
    let t = openAt;
    while (isBefore(t, closeAt)) {
        candidates.push(t);
        t = addMinutes(t, 30);
    }

    // 2. Gap Fillers (Dynamic Slots)
    // For every booking, the time IMMEDIATELY after it (+buffer) is a potential efficient slot.
    for (const b of dayBookings) {
        const potentialSlot = addMinutes(b.endAt, 10); // 10 min courtesy
        // Only if it's within bounds
        if (isAfter(potentialSlot, openAt) && isBefore(potentialSlot, closeAt)) {
            candidates.push(potentialSlot);
        }
    }

    // 3. Post-Break Slot
    // If there is a break, the time immediately after break ends is a valid slot (often matches standard grid, but good to ensure).
    if (breakEnd) {
        candidates.push(breakEnd);
    }

    // --- DEDUPLICATION & SORTING ---
    const uniqueCandidates = Array.from(new Set(candidates.map(d => d.getTime())))
        .sort((a, b) => a - b)
        .map(time => new Date(time));

    // --- VALIDATION PIPELINE ---
    const validSlots: string[] = [];

    for (const candidate of uniqueCandidates) {
        const candidateEnd = addMinutes(candidate, serviceDurationMinutes);
        const candidateEndWithBuffer = addMinutes(candidateEnd, 10); // Buffer at end too?
        // User said: "dejando 10 de cortesía". Usually means gap REQUIRED between bookings.
        // So: [Booking A] --10m-- [Booking B] --10m-- ...
        // Logic:
        // Start time `candidate` is valid IF:
        // 1. It fits in business day.
        // 2. It doesn't overlap bookings (considering buffers).
        // 3. It doesn't overlap break.

        let isValid = true;

        // 1. Boundaries
        if (isAfter(candidateEndWithBuffer, closeAt)) {
            isValid = false;
        }

        // 2. Break Intersection
        if (isValid && breakStart && breakEnd) {
            // Overlap: (Start < BreakEnd) AND (EndWithBuffer > BreakStart)
            if (isBefore(candidate, breakEnd) && isAfter(candidateEndWithBuffer, breakStart)) {
                isValid = false;
            }
        }

        // 3. Existing Bookings Intersection
        if (isValid) {
            for (const b of dayBookings) {
                // Check overlap.
                // Existing booking B has buffer 10m AFTER it.
                // So our Candidate Start must be >= B.End + 10m OR Candidate End+Buffer <= B.Start

                const bEndWithBuffer = addMinutes(b.endAt, 10);

                // If candidate starts BEFORE B finished+buffer AND candidate ends+buffer AFTER B started
                if (isBefore(candidate, bEndWithBuffer) && isAfter(candidateEndWithBuffer, b.startAt)) {
                    isValid = false;
                    break;
                }
            }
        }

        // 4. Past time check
        if (isValid && isBefore(candidate, new Date())) { // Strictly now.
            // Maybe add a small buffer for "now"? e.g. can't book exactly now, need 1 hour notice? 
            // Current logic was just "now". Keeping it.
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
