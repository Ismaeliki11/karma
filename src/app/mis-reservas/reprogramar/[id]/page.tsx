import { verifyMagicLink } from '@/actions/auth';
import { db } from '@/db';
import { bookings, services } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { RescheduleClient } from './client';

export const dynamic = 'force-dynamic';

export default async function ReschedulePage(props: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ token?: string }>;
}) {
    const searchParams = await props.searchParams;
    const params = await props.params;

    const token = searchParams.token;
    const bookingId = params.id;

    // 1. Verify Token
    if (!token) {
        redirect('/mis-reservas');
    }

    const verification = await verifyMagicLink(token);
    if (!verification.success || !verification.email) {
        redirect('/mis-reservas?error=invalid_token');
    }

    // 2. Fetch Booking Details (Securely check email)
    const bookingResult = await db.select({
        id: bookings.id,
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

    if (booking.customerEmail !== verification.email) {
        return <div className="p-8 text-center text-red-500">No tienes permiso para editar esta reserva</div>;
    }

    return (
        <RescheduleClient
            booking={booking as any}
            token={token}
            userEmail={verification.email}
        />
    );
}
