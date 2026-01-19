import { verifyMagicLink } from '@/actions/auth';
import { db } from '@/db';
import { bookings, services } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { ChangeServiceClient } from './client';



export default async function ChangeServicePage(props: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ token?: string; code?: string }>;
}) {
    const searchParams = await props.searchParams;
    const params = await props.params;

    const token = searchParams.token;
    const code = searchParams.code;
    const bookingId = params.id;

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

    const bookingResult = await db.select({
        id: bookings.id,
        bookingLocator: bookings.locator,
        serviceId: bookings.serviceId,
        customerEmail: bookings.customerEmail,
    })
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

    const booking = bookingResult[0];

    if (!booking) {
        return <div className="p-8 text-center text-red-500">Reserva no encontrada</div>;
    }

    // Authorization
    let isAuthorized = false;
    if (userEmail) {
        if (booking.customerEmail === userEmail) isAuthorized = true;
    } else if (code) {
        if (booking.bookingLocator === code) {
            isAuthorized = true;
            userEmail = booking.customerEmail;
        }
    }

    if (!isAuthorized) {
        return <div className="p-8 text-center text-red-500">No tienes permiso para editar esta reserva</div>;
    }

    if (!booking.serviceId) {
        return <div className="p-8 text-center text-red-500">La reserva no tiene un servicio asignado</div>;
    }

    return (
        <ChangeServiceClient
            bookingId={booking.id}
            currentServiceId={booking.serviceId}
            token={token}
            locator={booking.bookingLocator}
        />
    );
}
