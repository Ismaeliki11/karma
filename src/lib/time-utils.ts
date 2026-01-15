import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import { startOfDay, endOfDay, parse } from 'date-fns';

export const MADRID_TZ = 'Europe/Madrid';

/**
 * Converts a Date object (system time) to Madrid time components.
 * Useful for extracting "YYYY-MM-DD" or "HH:MM" in Madrid.
 */
export function getMadridDate(date: Date = new Date()): Date {
    return toZonedTime(date, MADRID_TZ);
}

/**
 * Returns the current ISO date string (YYYY-MM-DD) in Madrid.
 */
export function getMadridDateString(date: Date = new Date()): string {
    return format(toZonedTime(date, MADRID_TZ), 'yyyy-MM-dd', { timeZone: MADRID_TZ });
}

/**
 * Returns the "HH:mm" string in Madrid for a given Date.
 */
export function getMadridTimeString(date: Date): string {
    return format(toZonedTime(date, MADRID_TZ), 'HH:mm', { timeZone: MADRID_TZ });
}

/**
 * Parses a date string (YYYY-MM-DD) and time string (HH:mm) interpreted in Madrid,
 * and returns a UTC Date object (source of truth).
 */
export function parseMadridDateTime(dateStr: string, timeStr: string): Date {
    const dateTimeStr = `${dateStr} ${timeStr}`;
    // Parse as if it were in Madrid time, returns UTC equivalent
    // "2023-10-01 10:00" in Madrid -> UTC Timestamp
    return fromZonedTime(dateTimeStr, MADRID_TZ);
}

/**
 * Returns the start of the day in Madrid, converted to UTC.
 */
export function getMadridStartOfDay(date: Date): Date {
    const madridDate = toZonedTime(date, MADRID_TZ);
    const start = startOfDay(madridDate); // 00:00 in Madrid
    return fromZonedTime(start, MADRID_TZ); // Back to UTC
}

/**
 * Returns the end of the day in Madrid, converted to UTC.
 */
export function getMadridEndOfDay(date: Date): Date {
    const madridDate = toZonedTime(date, MADRID_TZ);
    const end = endOfDay(madridDate); // 23:59:59.999 in Madrid
    return fromZonedTime(end, MADRID_TZ); // Back to UTC
}
