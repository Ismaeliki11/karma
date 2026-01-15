import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FROM_EMAIL = 'Karma Beauty <citas@karmasalon.com>';

interface EmailBookingDetails {
    customerName: string;
    customerEmail: string;
    date: string;
    startTime: string;
    locator: string;
    magicLink?: string;
    serviceName?: string;
}

export const getEmailLayout = (content: string, subject: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fdf2f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px 40px;">
                            <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #0a0a0a; letter-spacing: 4px; text-transform: uppercase;">KARMA</h1>
                            <p style="margin: 8px 0 0 0; color: #737373; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 500;">Centro de Estética</p>
                        </td>
                    </tr>
                    
                    ${content}

                    <!-- Footer Info -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px; border-top: 1px solid #f5f5f5;">
                            <div style="text-align: center; padding-top: 30px;">
                                <h3 style="font-size: 18px; color: #0a0a0a; margin: 0 0 10px 0;">¡Te esperamos pronto!</h3>
                                <p style="margin: 0; color: #737373; font-size: 14px;">Centro de Estética Karma</p>
                                <a href="https://www.google.com/maps/search/?api=1&query=Centro+de+Estética+Karma" style="color: #0a0a0a; font-size: 14px; text-decoration: underline; margin-top: 12px; display: inline-block; font-weight: 500;">
                                    Ver ubicación en Google Maps
                                </a>
                            </div>
                        </td>
                    </tr>
                </table>
                <!-- Legal Footer -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px;">
                    <tr>
                        <td align="center" style="padding: 30px 40px; color: #a3a3a3; font-size: 12px; line-height: 1.5;">
                            <p style="margin: 0;">Este es un mensaje automático enviado por Karma Beauty Salon.</p>
                            <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} Karma Beauty. Todos los derechos reservados.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

export async function sendBookingConfirmationEmail(details: EmailBookingDetails) {
    const { customerName, customerEmail, date, startTime, locator, magicLink, serviceName } = details;
    const link = magicLink || `${APP_URL}/mis-reservas/reserva/${locator}`;
    const subject = 'Confirmación de Reserva - Karma Beauty Salon';

    const content = `
        <tr>
            <td style="padding: 20px 40px 40px 40px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="background-color: #0a0a0a; color: #ffffff; width: 60px; height: 60px; line-height: 60px; border-radius: 50%; font-size: 30px; margin: 0 auto 20px auto;">✓</div>
                    <h2 style="font-size: 26px; color: #0a0a0a; margin: 0; font-weight: 700;">¡Reserva Confirmada!</h2>
                    <p style="color: #4a4a4a; font-size: 16px; margin-top: 12px; line-height: 1.5;">Hola <strong>${customerName}</strong>, tu cita en Karma ha sido confirmada con éxito.</p>
                </div>
                
                <!-- Details Card -->
                <div style="background-color: #fdf2f2; border-radius: 20px; padding: 30px; margin-bottom: 35px; border: 1px solid #ffe4e6;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td style="padding-bottom: 20px;">
                                <span style="color: #ed4191; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Fecha y Hora</span>
                                <p style="margin: 4px 0 0 0; font-size: 18px; color: #0a0a0a; font-weight: 600;">${date} — ${startTime}</p>
                            </td>
                        </tr>
                        ${serviceName ? `
                        <tr>
                            <td style="padding-bottom: 20px;">
                                <span style="color: #ed4191; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Servicio</span>
                                <p style="margin: 4px 0 0 0; font-size: 18px; color: #0a0a0a; font-weight: 600;">${serviceName}</p>
                            </td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td>
                                <span style="color: #ed4191; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Código de Reserva</span>
                                <p style="margin: 4px 0 0 0; font-size: 22px; color: #0a0a0a; font-weight: 800; letter-spacing: 2px;">${locator}</p>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- CTA -->
                <div style="text-align: center;">
                    <a href="${link}" style="background-color: #0a0a0a; color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 14px; font-weight: 600; display: inline-block; font-size: 16px; transition: all 0.3s ease;">
                        Gestionar mi Reserva
                    </a>
                    <p style="margin-top: 25px; color: #737373; font-size: 13px; line-height: 1.5;">¿Necesitas cambiar la hora o cancelar? <br>Haz clic en el botón superior.</p>
                </div>
            </td>
        </tr>
    `;

    return await resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        subject,
        html: getEmailLayout(content, subject)
    });
}

export async function sendBookingUpdateEmail(details: EmailBookingDetails) {
    const { customerName, customerEmail, date, startTime, locator, magicLink, serviceName } = details;
    const link = magicLink || `${APP_URL}/mis-reservas/reserva/${locator}`;
    const subject = 'Reserva Actualizada - Karma Beauty Salon';

    const content = `
        <tr>
            <td style="padding: 20px 40px 40px 40px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="background-color: #ed4191; color: #ffffff; width: 60px; height: 60px; line-height: 60px; border-radius: 50%; font-size: 30px; margin: 0 auto 20px auto;">↻</div>
                    <h2 style="font-size: 26px; color: #0a0a0a; margin: 0; font-weight: 700;">Cita Actualizada</h2>
                    <p style="color: #4a4a4a; font-size: 16px; margin-top: 12px; line-height: 1.5;">Hola <strong>${customerName}</strong>, los datos de tu reserva han sido actualizados.</p>
                </div>
                
                <div style="background-color: #fdf2f2; border-radius: 20px; padding: 30px; margin-bottom: 35px; border: 1px solid #ffe4e6;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td style="padding-bottom: 20px;">
                                <span style="color: #ed4191; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Nueva Fecha y Hora</span>
                                <p style="margin: 4px 0 0 0; font-size: 18px; color: #0a0a0a; font-weight: 600;">${date} — ${startTime}</p>
                            </td>
                        </tr>
                        ${serviceName ? `
                        <tr>
                            <td style="padding-bottom: 20px;">
                                <span style="color: #ed4191; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Servicio</span>
                                <p style="margin: 4px 0 0 0; font-size: 18px; color: #0a0a0a; font-weight: 600;">${serviceName}</p>
                            </td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td>
                                <span style="color: #ed4191; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Localizador</span>
                                <p style="margin: 4px 0 0 0; font-size: 22px; color: #0a0a0a; font-weight: 800; letter-spacing: 2px;">${locator}</p>
                            </td>
                        </tr>
                    </table>
                </div>

                <div style="text-align: center;">
                    <a href="${link}" style="background-color: #0a0a0a; color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 14px; font-weight: 600; display: inline-block; font-size: 16px;">
                        Ver detalles de mi Cita
                    </a>
                </div>
            </td>
        </tr>
    `;

    return await resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        subject,
        html: getEmailLayout(content, subject)
    });
}
