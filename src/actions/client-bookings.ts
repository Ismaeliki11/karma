'use server';

import { db } from '@/db';
import { bookings, services } from '@/db/schema';
import { eq, and, desc, gte, not, lt, or, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Fetches active (future) bookings for a given email.
 */
export async function getClientBookings(email: string) {
    try {
        const now = new Date();

        const clientBookings = await db.select({
            id: bookings.id,
            locator: bookings.locator,
            date: bookings.date,
            time: bookings.startTime,
            serviceName: services.name,
            servicePrice: services.price,
            serviceDuration: services.duration,
            status: bookings.status,
            startAt: bookings.startAt,
            createdAt: bookings.createdAt,
        })
            .from(bookings)
            .leftJoin(services, eq(bookings.serviceId, services.id))
            .where(
                and(
                    eq(bookings.customerEmail, email),
                    // Exclude deleted
                    ne(bookings.status, 'DELETED'),
                    // Logic: Show if (future) OR (past AND status != CANCELLED)
                    or(
                        gte(bookings.startAt, now), // Future: Show everything (Pending, Confirmed, Cancelled)
                        and(
                            lt(bookings.startAt, now), // Past:
                            ne(bookings.status, 'CANCELLED') // Hide if Cancelled
                        )
                    )
                )
            )
            .orderBy(desc(bookings.startAt));

        return { success: true, bookings: clientBookings };
    } catch (error) {
        console.error('Error fetching client bookings:', error);
        return { success: false, error: 'Error al recuperar las reservas.' };
    }
}

/**
 * soft-deletes a booking (hides from user).
 */
export async function deleteClientBooking(bookingId: string, userEmail: string) {
    try {
        const booking = await db.query.bookings.findFirst({
            where: eq(bookings.id, bookingId),
        });

        if (!booking) {
            return { success: false, error: 'Reserva no encontrada' };
        }

        if (booking.customerEmail !== userEmail) {
            return { success: false, error: 'No tienes permiso.' };
        }

        await db.update(bookings)
            .set({ status: 'DELETED' })
            .where(eq(bookings.id, bookingId));

        revalidatePath('/mis-reservas/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error deleting booking:', error);
        return { success: false, error: 'Error al eliminar la reserva' };
    }
}

/**
 * Cancels a booking.
 * Note: Should we verify ownership again here? Ideally yes, but if this action 
 * is called from a page protected by the magic link token verification, we are relatively safe.
 * However, passing the email and ensuring it matches the booking is best practice.
 */
export async function cancelClientBooking(bookingId: string, userEmail: string) {
    try {
        const booking = await db.query.bookings.findFirst({
            where: eq(bookings.id, bookingId),
        });

        if (!booking) {
            return { success: false, error: 'Reserva no encontrada' };
        }

        if (booking.customerEmail !== userEmail) {
            return { success: false, error: 'No tienes permiso para cancelar esta reserva' };
        }

        await db.update(bookings)
            .set({ status: 'CANCELLED' })
            .where(eq(bookings.id, bookingId));

        revalidatePath('/mis-reservas/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error cancelling booking:', error);
        return { success: false, error: 'Error al cancelar la reserva' };
    }
}

/**
 * Fetches a single booking by its locator.
 * Used for the "mis-reservas" code access feature.
 */
export async function getBookingByLocator(locator: string) {
    try {
        const result = await db.select({
            id: bookings.id,
            locator: bookings.locator,
            date: bookings.date,
            time: bookings.startTime,
            serviceName: services.name,
            servicePrice: services.price,
            serviceDuration: services.duration,
            status: bookings.status,
            startAt: bookings.startAt,
            createdAt: bookings.createdAt,
            customerEmail: bookings.customerEmail,
            serviceId: bookings.serviceId, // Needed for changes
        })
            .from(bookings)
            .leftJoin(services, eq(bookings.serviceId, services.id))
            .where(
                and(
                    eq(bookings.locator, locator),
                    ne(bookings.status, 'DELETED')
                )
            )
            .limit(1);

        const booking = result[0];

        if (!booking) {
            return { success: false, error: 'Reserva no encontrada con ese código.' };
        }

        return { success: true, booking };
    } catch (error) {
        console.error('Error fetching booking by locator:', error);
        return { success: false, error: 'Error al buscar la reserva.' };
    }
}
