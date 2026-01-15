
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
    console.log('Testing Email Sending...');
    console.log('User:', process.env.EMAIL_USER);
    // Hide pass for security in logs, just show length
    console.log('Pass Length:', process.env.EMAIL_PASS?.length);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('Missing credentials in .env.local');
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: `"Karma Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to self
            subject: "Test Email from Karma",
            text: "If you see this, the configuration is correct!",
        });

        console.log('Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

main();
