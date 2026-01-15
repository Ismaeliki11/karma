import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FROM_EMAIL = 'Karma Beauty <onboarding@resend.dev>';

interface EmailBookingDetails {
    customerName: string;
    customerEmail: string;
    date: string;
    startTime: string;
    locator: string;
    magicLink?: string;
    serviceName?: string;
}

export async function sendBookingConfirmationEmail(details: EmailBookingDetails) {
    const { customerName, customerEmail, date, startTime, locator, magicLink } = details;

    // Fallback/Default Link
    const link = magicLink || `${APP_URL}/mis-reservas/reserva/${locator}`;

    return await resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        subject: 'Confirmación de Reserva - Karma Beauty Salon',
        html: `
            <h1>¡Reserva Confirmada!</h1>
            <p>Hola ${customerName},</p>
            <p>Tu cita ha sido confirmada correctamente.</p>
            <p><strong>Fecha:</strong> ${date} a las ${startTime}</p>
            <p><strong>Localizador:</strong> ${locator}</p>
            <br>
            <p>
                <a href="${link}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
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
}

export async function sendBookingUpdateEmail(details: EmailBookingDetails) {
    const { customerName, customerEmail, date, startTime, locator, magicLink, serviceName } = details;
    const link = magicLink || `${APP_URL}/mis-reservas/reserva/${locator}`;

    return await resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        subject: 'Reserva Actualizada - Karma Beauty Salon',
        html: `
            <h1>Tu reserva ha sido modificada</h1>
            <p>Hola ${customerName},</p>
            <p>Te confirmamos que hemos actualizado los datos de tu cita.</p>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Nueva Fecha:</strong> ${date}</p>
                <p style="margin: 5px 0;"><strong>Nueva Hora:</strong> ${startTime}</p>
                ${serviceName ? `<p style="margin: 5px 0;"><strong>Servicio:</strong> ${serviceName}</p>` : ''}
                <p style="margin: 5px 0;"><strong>Localizador:</strong> ${locator}</p>
            </div>

            <p>
                <a href="${link}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Ver detalles
                </a>
            </p>
            
            <br>
            <p>¡Gracias por confiar en nosotros!</p>
            <p>Karma Beauty Salon</p>
        `
    });
}
