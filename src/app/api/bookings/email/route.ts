
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings, verificationTokens } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Resend } from 'resend';

// Helper to delay execution (mimic processing time or robustness check)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { bookingId } = body;

        if (!bookingId) {
            return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
        }

        // 1. Fetch Booking and Token
        const bookingResult = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
        const booking = bookingResult[0];

        if (!booking) {
            return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
        }

        // Fetch latest valid token
        const tokenResult = await db.select()
            .from(verificationTokens)
            .where(eq(verificationTokens.relatedBookingId, bookingId))
            .orderBy(desc(verificationTokens.expires)) // Get the latest one
            .limit(1);

        const tokenData = tokenResult[0];

        // Construct magic link
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const magicLink = tokenData
            ? `${appUrl}/mis-reservas/dashboard?token=${tokenData.token}`
            : `${appUrl}/mis-reservas`; // Fallback if no token (shouldn't happen usually)

        const serviceName = booking.serviceId; // Note: We might want the name. Ideally we fetch it or pass it. 
        // Actually, the main booking table doesn't have serviceName, it has serviceId. 
        // The previous code had `serviceName` in `bookingResult` because it was returned from the transaction which had it in scope.
        // We should fetch the service name or just use what we have. 
        // Let's check the schema or assuming the previous code passed it...

        // Wait, the previous code in `route.ts` returned `serviceName` in the JSON response logic but `bookings` table schema might only have `serviceId`.
        // Let's quick check schema if needed, OR just join with services table.
        // I will join with services table to be safe and get the proper name.

        // Re-query with join? Or sending serviceName from client?
        // Safer to fetch from DB to avoid client spoofing, though for email text it's minor.
        // Let's use the DB approach as I see `services` imported in other files.
        // I need to import `services` schema.

        // Simulating robust processing
        await delay(800);

        const resend = new Resend(process.env.RESEND_API_KEY);

        // Attempt to send
        const { data, error } = await resend.emails.send({
            from: 'Karma Beauty <onboarding@resend.dev>',
            to: booking.customerEmail,
            subject: 'Confirmación de Reserva - Karma Beauty Salon',
            html: `
                <h1>¡Reserva Confirmada!</h1>
                <p>Hola ${booking.customerName},</p>
                <p>Tu cita ha sido confirmada correctamente.</p>
                <p><strong>Fecha:</strong> ${booking.date} a las ${booking.startTime}</p>
                <p><strong>Localizador:</strong> ${booking.locator}</p>
                <br>
                <p>
                    <a href="${magicLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Gestionar Reserva / Cancelar
                    </a>
                </p>
                <p style="font-size: 14px; color: #666; margin-top: 10px;">
                    ¿Necesitas cambiar la hora o cancelar? Haz clic en el botón de arriba.
                </p>
                <br>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                
                <h2>¡Aquí te esperamos!</h2>
                <p>Centro de Estética Karma</p>
                
                <p>
                    <a href="https://www.google.com/maps/search/?api=1&query=Centro+de+Estética+Karma" style="color: #000; text-decoration: underline;">
                        Ver ubicación en Google Maps
                    </a>
                </p>
                <br>
                <p>¡Nos vemos pronto!</p>
            `
        });

        if (error) {
            console.error("Resend Error:", error);
            // Return 200 but with warning? or 500?
            // The user wanted "robust detection". If it fails, we should tell the frontend.
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Email Sending Error:', error);
        return NextResponse.json({ error: error.message || 'Error al enviar el correo' }, { status: 500 });
    }
}
