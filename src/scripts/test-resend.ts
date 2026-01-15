
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
    console.log('Testing Resend Email Sending...');
    const key = process.env.RESEND_API_KEY;
    console.log('API Key Present:', !!key);

    if (!key) {
        console.error('Missing RESEND_API_KEY in .env.local');
        return;
    }

    const resend = new Resend(key);

    try {
        const { data, error } = await resend.emails.send({
            from: 'Karma Beauty <onboarding@resend.dev>',
            to: 'delivered@resend.dev', // Safe test address provided by Resend
            subject: 'Test Email from Karma Script',
            html: '<p>It works!</p>'
        });

        if (error) {
            console.error('Resend Error:', error);
        } else {
            console.log('Email sent successfully!', data);
        }
    } catch (err) {
        console.error('Unexpected Error:', err);
    }
}

main();
