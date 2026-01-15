import { NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings, verificationTokens } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { sendBookingConfirmationEmail } from '@/lib/email';

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
            : undefined;

        // Simulating robust processing
        await delay(800);

        // Attempt to send
        const { data, error } = await sendBookingConfirmationEmail({
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            date: booking.date,
            startTime: booking.startTime,
            locator: booking.locator,
            magicLink
        });

        if (error) {
            console.error("Resend Error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Email Sending Error:', error);
        return NextResponse.json({ error: error.message || 'Error al enviar el correo' }, { status: 500 });
    }
}
