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
        const { getEmailLayout } = await import('@/lib/email');
        const subject = 'Gestionar mis reservas - Karma Beauty Salon';

        const content = `
        <tr>
            <td style="padding: 20px 40px 40px 40px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="background-color: #0a0a0a; color: #ffffff; width: 60px; height: 60px; line-height: 60px; border-radius: 50%; font-size: 30px; margin: 0 auto 20px auto;">🔑</div>
                    <h2 style="font-size: 26px; color: #0a0a0a; margin: 0; font-weight: 700;">Acceso a tus Reservas</h2>
                    <p style="color: #4a4a4a; font-size: 16px; margin-top: 12px; line-height: 1.5;">Haz clic en el siguiente botón para ver, cancelar o gestionar tus citas en Karma.</p>
                </div>
                
                <!-- CTA -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <a href="${link}" style="background-color: #0a0a0a; color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 14px; font-weight: 600; display: inline-block; font-size: 16px;">
                        Ver mis reservas
                    </a>
                </div>

                <div style="background-color: #f5f5f5; border-radius: 12px; padding: 20px; text-align: center;">
                    <p style="color: #737373; font-size: 13px; margin: 0; line-height: 1.5;">
                        Este enlace caduca en 24 horas por seguridad.<br>
                        Si no has solicitado este acceso, puedes ignorar este correo.
                    </p>
                </div>
            </td>
        </tr>
    `;

        await resend.emails.send({
            from: 'Karma Beauty <citas@karmasalon.com>',
            to: email,
            subject,
            html: getEmailLayout(content, subject),
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
