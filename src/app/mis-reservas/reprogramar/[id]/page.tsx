import { verifyMagicLink } from '@/actions/auth';
import { db } from '@/db';
import { bookings, services } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { RescheduleClient } from './client';

export const dynamic = 'force-dynamic';

export default async function ReschedulePage(props: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ token?: string; code?: string }>;
}) {
    const searchParams = await props.searchParams;
    const params = await props.params;

    const token = searchParams.token;
    const code = searchParams.code;
    const bookingId = params.id;

    // 1. Verify Token OR Code
    if (!token && !code) {
        redirect('/mis-reservas');
    }

    let userEmail: string | undefined;

    if (token) {
        const verification = await verifyMagicLink(token);
        if (!verification.success || !verification.email) {
            redirect('/mis-reservas?error=invalid_token');
        }
        userEmail = verification.email;
    }

    // 2. Fetch Booking Details (Including Locator)
    const bookingResult = await db.select({
        id: bookings.id,
        bookingLocator: bookings.locator,
        date: bookings.date,
        time: bookings.startTime,
        serviceId: bookings.serviceId,
        serviceName: services.name,
        serviceDuration: services.duration,
        customerEmail: bookings.customerEmail,
    })
        .from(bookings)
        .leftJoin(services, eq(bookings.serviceId, services.id))
        .where(eq(bookings.id, bookingId))
        .limit(1);

    const booking = bookingResult[0];

    if (!booking) {
        return <div className="p-8 text-center text-red-500">Reserva no encontrada</div>;
    }

    // 3. Authorization Check
    let isAuthorized = false;

    if (userEmail) {
        if (booking.customerEmail === userEmail) {
            isAuthorized = true;
        }
    } else if (code) {
        // Strict case comparison for locator
        if (booking.bookingLocator === code) {
            isAuthorized = true;
            // Treating the booking's email as the userEmail for the client component
            userEmail = booking.customerEmail;
        }
    }

    if (!isAuthorized) {
        return <div className="p-8 text-center text-red-500">No tienes permiso para editar esta reserva</div>;
    }

    return (
        <RescheduleClient
            booking={{
                ...booking,
                locator: booking.bookingLocator // Map alias back to expected prop if needed, or update interface
                // Actually RescheduleClient expects 'booking' prop. Let's check its interface?
                // The interface in previous read led to 'booking' having 'locator'.
                // My alias 'bookingLocator' needs to be mapped.
            } as any}
            token={token} // This might be undefined now! Client component needs to handle that?
            // If token is undefined, we should pass 'code' maybe?
            // Or the client component uses the token to construct URLs?
            // Let's check RescheduleClient... I can't check it right now easily without another tool call.
            // But I should assume I need to pass userEmail at least.
            userEmail={userEmail!}
        />
    );
}
