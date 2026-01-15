'use server';

import { db } from '@/db';
import { verificationTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { Resend } from 'resend';
import { addHours, isAfter } from 'date-fns';

/**
 * Generates a magic link token, saves it to DB, and sends an email.
 * If bookingId is provided, the link might be context-specific.
 */
export async function sendMagicLink(email: string, bookingId?: string) {
    try {
        const token = nanoid(32); // Secure enough for short-lived tokens
        const expires = addHours(new Date(), 24); // 24 hour expiration

        // 1. Save token to DB
        await db.insert(verificationTokens).values({
            token,
            identifier: email,
            expires,
            relatedBookingId: bookingId,
        });

        // 2. Send Email
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const link = `${appUrl}/mis-reservas/dashboard?token=${token}`;

        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
            from: 'Karma Beauty <onboarding@resend.dev>',
            to: email,
            subject: 'Gestionar mis reservas - Karma Beauty Salon',
            html: `
                <h1>Acceso a tus reservas</h1>
                <p>Haz clic en el siguiente enlace para ver, cancelar o gestionar tus citas.</p>
                <p>
                    <a href="${link}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Ver mis reservas
                    </a>
                </p>
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                    Este enlace caduca en 24 horas. Si no lo has solicitado, puedes ignorar este correo.
                </p>
            `,
        });

        return { success: true };
    } catch (error) {
        console.error('Error sending magic link:', error);
        return { success: false, error: 'No se pudo enviar el enlace. Inténtalo de nuevo.' };
    }
}

/**
 * Verifies a token and returns the identifier (email) if valid.
 */
export async function verifyMagicLink(token: string) {
    try {
        const result = await db.select().from(verificationTokens).where(eq(verificationTokens.token, token)).limit(1);
        const storedToken = result[0];

        if (!storedToken) {
            return { success: false, error: 'Enlace inválido o no encontrado.' };
        }

        if (isAfter(new Date(), storedToken.expires)) {
            // Optional: Cleanup expired token
            return { success: false, error: 'El enlace ha caducado. Solicita uno nuevo.' };
        }

        // Token is valid!
        // We could delete it now (single use) or keep it until expiry. 
        // For better UX during "Edit" flow where page might reload, keeping it until expiry is safer.

        return { success: true, email: storedToken.identifier };
    } catch (error) {
        console.error('Error verifying token:', error);
        return { success: false, error: 'Error al verificar el enlace.' };
    }
}
