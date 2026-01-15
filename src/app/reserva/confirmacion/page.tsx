
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useBooking } from '@/context/BookingContext';
import { useEffect, Suspense, useState, useRef } from 'react';
import { CheckCircle2, Home, Mail, Loader2, AlertTriangle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import confetti from 'canvas-confetti';

function ConfirmationContent() {
    const searchParams = useSearchParams();
    const locator = searchParams.get('locator');
    const bookingId = searchParams.get('id');
    const isNew = searchParams.get('new') === 'true';
    const { booking } = useBooking();

    // If not new, show success directly. If new, start in idle -> sending.
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'email_error'>(isNew ? 'idle' : 'success');
    const sentRef = useRef(false);

    useEffect(() => {
        // Trigger email sending only once if it's a new booking
        if (isNew && bookingId && status === 'idle' && !sentRef.current) {
            sentRef.current = true;
            setStatus('sending');

            fetch('/api/bookings/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId }),
            })
                .then(async (res) => {
                    if (res.ok) {
                        // Force a minimum delay so the animation is visible
                        setTimeout(() => setStatus('success'), 2000);
                    } else {
                        console.error("Email API failed");
                        setTimeout(() => setStatus('email_error'), 2000);
                    }
                })
                .catch((err) => {
                    console.error("Email Network Error", err);
                    setStatus('email_error');
                });
        }
    }, [isNew, bookingId, status]);

    // Confetti effect on success
    useEffect(() => {
        if (status === 'success') {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval = window.setInterval(function () {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) return clearInterval(interval);
                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
            return () => clearInterval(interval);
        }
    }, [status]);

    // Render logic
    const renderContent = () => {
        if (status === 'sending') {
            return (
                <div className="space-y-6">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mx-auto w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6 relative"
                    >
                        <div className="absolute inset-0 border-4 border-neutral-200 border-t-black rounded-full animate-spin"></div>
                        <Mail size={32} className="text-neutral-400" />
                    </motion.div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-semibold text-neutral-900">Confirmando detalles...</h1>
                        <p className="text-neutral-500">Estamos enviando tu confirmación por correo.</p>
                        <div className="bg-amber-50 text-amber-800 text-sm px-4 py-3 rounded-lg flex items-start gap-2 text-left mt-4 border border-amber-100">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p>Si no recibes el correo en unos minutos, por favor <strong>revisa tu carpeta de Spam o Correo no deseado</strong>.</p>
                        </div>
                    </div>
                </div>
            );
        }

        if (status === 'email_error') {
            return (
                <div className="space-y-6">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mx-auto w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6"
                    >
                        <AlertTriangle size={48} />
                    </motion.div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-neutral-900">¡Reserva Confirmada!</h1>
                        <p className="text-neutral-500 max-w-sm mx-auto">
                            Tu cita está reservada, pero hubo un pequeño problema al enviar el correo. No te preocupes, te esperamos.
                        </p>
                    </div>
                </div>
            );
        }

        // Success or default
        return (
            <div className="space-y-6">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="mx-auto w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6"
                >
                    <CheckCircle2 size={48} />
                </motion.div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-neutral-900">¡Reserva Confirmada!</h1>
                    <p className="text-neutral-500">
                        Hemos enviado un correo con todos los detalles.
                    </p>
                    <div className="bg-neutral-50 text-neutral-600 text-sm px-4 py-2 rounded-lg inline-block mt-2">
                        ⚠️ Revisa tu bandeja de <strong>Spam/Basura</strong> si no lo ves.
                    </div>
                </div>
            </div>
        );
    };

    // Prevent blink if starting new
    if (status === 'idle' && isNew) return null;

    return (
        <div className="max-w-md mx-auto text-center space-y-8 pt-10 pb-20">
            {renderContent()}

            {(status === 'success' || status === 'email_error' || (!isNew && status === 'idle')) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-8"
                >
                    <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm text-left space-y-4">
                        <div>
                            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Localizador</span>
                            <p className="text-2xl font-mono font-bold tracking-widest text-black">{locator || 'PENDING'}</p>
                        </div>

                        <div className="h-px bg-neutral-100" />

                        <div>
                            <p className="text-sm text-neutral-500">Servicio</p>
                            <p className="font-medium text-neutral-900">{booking.serviceName || 'Servicio de Belleza'}</p>
                        </div>
                    </div>

                    {/* Google Maps Section */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-neutral-900">¡Aquí te esperamos!</h2>
                        <div className="rounded-2xl overflow-hidden border border-neutral-200 shadow-sm">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d55414.28724415761!2d-1.5486146370758704!3d37.78594561871283!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd649372a782faed%3A0xf05ab0ad51578468!2sCentro%20de%20Est%C3%A9tica%20Karma!5e0!3m2!1ses!2ses!4v1768473725456!5m2!1ses!2ses"
                                width="100%"
                                height="250"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </div>
                        <a
                            href="https://www.google.com/maps/search/?api=1&query=Centro+de+Estética+Karma"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-white text-neutral-900 border border-neutral-200 py-4 px-6 rounded-xl font-medium shadow-sm hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Home size={20} />
                            Ir a Google Maps
                        </a>
                    </div>

                    <p className="text-sm text-neutral-400 px-8">
                        Puedes usar tu número de reserva para modificar o cancelar tu cita en cualquier momento.
                    </p>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-neutral-900 font-medium hover:underline"
                    >
                        Volver al inicio
                    </Link>
                </motion.div>
            )}
        </div>
    );
}

export default function ConfirmacionPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        }>
            <ConfirmationContent />
        </Suspense>
    );
}
