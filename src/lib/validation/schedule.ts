
import { parse, isAfter, isBefore, isEqual } from 'date-fns';

export interface TimeRange {
    openTime: string;
    closeTime: string;
    breakStart?: string | null;
    breakEnd?: string | null;
}

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Validates a single day's schedule logic.
 * Ensures:
 * 1. Open < Close
 * 2. Break Start < Break End
 * 3. Break is fully contained within Open and Close
 */
export function validateScheduleLogic(schedule: TimeRange): ValidationResult {
    const { openTime, closeTime, breakStart, breakEnd } = schedule;

    // Helper: Parse HH:mm to Date (using dummy date)
    const toDate = (time: string) => parse(time, 'HH:mm', new Date());

    const open = toDate(openTime);
    const close = toDate(closeTime);

    if (!isBefore(open, close)) {
        return { isValid: false, error: 'La hora de apertura debe ser anterior al cierre.' };
    }

    if (breakStart && breakEnd) {
        const bStart = toDate(breakStart);
        const bEnd = toDate(breakEnd);

        if (!isBefore(bStart, bEnd)) {
            return { isValid: false, error: 'El inicio del descanso debe ser anterior al fin.' };
        }

        // Break must be within Open/Close
        // We allow break to start AT open (though weird) or end AT close.
        // Strict containment: open <= bStart < bEnd <= close
        if (isBefore(bStart, open)) {
            return { isValid: false, error: 'El descanso no puede empezar antes de abrir.' };
        }
        if (isAfter(bEnd, close)) {
            return { isValid: false, error: 'El descanso no puede terminar después de cerrar.' };
        }
    } else if ((breakStart && !breakEnd) || (!breakStart && breakEnd)) {
        return { isValid: false, error: 'Debes definir inicio y fin del descanso.' };
    }

    return { isValid: true };
}
