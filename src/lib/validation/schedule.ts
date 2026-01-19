
import { parse, isAfter, isBefore, isEqual } from 'date-fns';

export interface Shift {
    start: string;
    end: string;
}

export interface DailyScheduleInput {
    isClosed?: boolean;
    morningStart?: string | null;
    morningEnd?: string | null;
    afternoonStart?: string | null;
    afternoonEnd?: string | null;
}

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Validates a single day's schedule logic.
 * Ensures:
 * 1. Morning Start < Morning End
 * 2. Afternoon Start < Afternoon End
 * 3. Morning End < Afternoon Start (if both exist)
 */
export function validateScheduleLogic(schedule: DailyScheduleInput): ValidationResult {
    const { isClosed, morningStart, morningEnd, afternoonStart, afternoonEnd } = schedule;

    if (isClosed) return { isValid: true };

    // Helper: Parse HH:mm
    const toDate = (time: string, baseDate = new Date()) => parse(time, 'HH:mm', baseDate);

    let hasMorning = false;
    let hasAfternoon = false;

    // Validate Morning
    if (morningStart && morningEnd) {
        hasMorning = true;
        if (!isBefore(toDate(morningStart), toDate(morningEnd))) {
            return { isValid: false, error: 'Mañana: Hora fin debe ser posterior al inicio.' };
        }
    } else if (morningStart || morningEnd) {
        return { isValid: false, error: 'Mañana: Debes indicar inicio y fin.' };
    }

    // Validate Afternoon
    if (afternoonStart && afternoonEnd) {
        hasAfternoon = true;
        if (!isBefore(toDate(afternoonStart), toDate(afternoonEnd))) {
            return { isValid: false, error: 'Tarde: Hora fin debe ser posterior al inicio.' };
        }
    } else if (afternoonStart || afternoonEnd) {
        return { isValid: false, error: 'Tarde: Debes indicar inicio y fin.' };
    }

    // Check Overlap / Order if both exist
    if (hasMorning && hasAfternoon) {
        // Morning End must be before Afternoon Start
        if (!isBefore(toDate(morningEnd!), toDate(afternoonStart!))) {
            return { isValid: false, error: 'Solapamiento: El turno de mañana debe terminar antes de que empiece la tarde.' };
        }
    }

    if (!hasMorning && !hasAfternoon) {
        return { isValid: false, error: 'Debes configurar al menos un turno (Mañana o Tarde) o cerrar el día.' };
    }

    return { isValid: true };
}
