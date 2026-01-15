
'use client';

import { useBooking } from '@/context/BookingContext';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from "sonner";

export default function DatosPage() {
    const { booking, updateBooking } = useBooking();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!booking.serviceId) {
            router.push('/reserva/servicios');
        } else if (!booking.date || !booking.time) {
            router.push('/reserva/calendario');
        }
    }, [booking.serviceId, booking.date, booking.time, router]);

    if (!booking.serviceId || !booking.date || !booking.time) return null;

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!booking.customer.name.trim()) newErrors.name = 'El nombre es obligatorio';
        if (!booking.customer.email.trim()) newErrors.email = 'El correo es obligatorio';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.customer.email)) newErrors.email = 'Correo inválido';
        if (!booking.customer.phone.trim()) newErrors.phone = 'El teléfono es obligatorio';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);

        try {
            // Step 1: Create Booking
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...booking,
                    date: booking.date ? format(booking.date, 'yyyy-MM-dd') : null
                }),
            });

            if (!res.ok) {
                let errorMessage = `Error ${res.status}: No se pudo crear la reserva`;
                try {
                    const errorData = await res.json();
                    if (errorData.error) errorMessage = errorData.error;
                } catch (e) { }
                throw new Error(errorMessage);
            }

            const data = await res.json();

            // Redirect immediately to confirmation. 
            // The confirmation page will handle the email sending animation.
            router.push(`/reserva/confirmacion?locator=${data.locator}&id=${data.id}&new=true`);

        } catch (error) {
            console.error('Submission error:', error);
            const message = error instanceof Error ? error.message : 'Error desconocido';
            toast.error(`Error al crear la reserva: ${message}`);
            setLoading(false); // Only stop loading if error (otherwise we are redirecting)
        }
    };

    const handleBack = () => {
        router.push('/reserva/calendario');
    };

    const handleChange = (field: keyof typeof booking.customer, value: string) => {
        updateBooking({
            customer: { ...booking.customer, [field]: value }
        });
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <div className="space-y-8 max-w-xl mx-auto pb-32 md:pb-0">
            <div className="text-center">
                <h1 className="text-3xl font-light tracking-wide text-neutral-900">Tus Datos</h1>
                <p className="mt-2 text-neutral-500">Para enviarte la confirmación</p>
            </div>

            <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100 space-y-6"
            >
                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-neutral-700">Nombre completo</label>
                    <input
                        type="text"
                        id="name"
                        disabled={loading}
                        value={booking.customer.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className={cn(
                            "w-full px-4 py-3 rounded-xl border bg-neutral-50 focus:bg-white transition-all outline-none",
                            errors.name ? "border-red-500 focus:border-red-500" : "border-neutral-200 focus:border-black",
                            loading && "opacity-60"
                        )}
                        placeholder="Ej. María García"
                    />
                    {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-neutral-700">Correo electrónico</label>
                    <input
                        type="email"
                        id="email"
                        disabled={loading}
                        value={booking.customer.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className={cn(
                            "w-full px-4 py-3 rounded-xl border bg-neutral-50 focus:bg-white transition-all outline-none",
                            errors.email ? "border-red-500 focus:border-red-500" : "border-neutral-200 focus:border-black",
                            loading && "opacity-60"
                        )}
                        placeholder="ejemplo@correo.com"
                    />
                    {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium text-neutral-700">Teléfono</label>
                    <input
                        type="tel"
                        id="phone"
                        disabled={loading}
                        value={booking.customer.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className={cn(
                            "w-full px-4 py-3 rounded-xl border bg-neutral-50 focus:bg-white transition-all outline-none",
                            errors.phone ? "border-red-500 focus:border-red-500" : "border-neutral-200 focus:border-black",
                            loading && "opacity-60"
                        )}
                        placeholder="+34 600 000 000"
                    />
                    {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                    <label htmlFor="notes" className="text-sm font-medium text-neutral-700 flex justify-between">
                        Más información
                        <span className="text-neutral-400 font-normal text-xs italic">Opcional</span>
                    </label>
                    <textarea
                        id="notes"
                        rows={3}
                        disabled={loading}
                        value={booking.customer.notes}
                        onChange={(e) => handleChange('notes', e.target.value)}
                        className={cn(
                            "w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-black transition-all outline-none resize-none",
                            loading && "opacity-60"
                        )}
                        placeholder="Si tienes alguna duda o necesidad especial, dínoslo aquí."
                    />
                </div>

                <div className="mt-8 overflow-hidden rounded-3xl border border-neutral-100 shadow-sm transition-all duration-300 hover:shadow-md">
                    <div className="bg-neutral-50/50 p-6 md:p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Resumen de tu cita</h3>
                            <div className="h-px flex-1 bg-neutral-100 mx-4 hidden md:block" />
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-xl font-bold text-neutral-900">{booking.serviceName}</h4>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-neutral-600 font-medium">
                                            Día {booking.date ? booking.date.getDate() : ''} de {booking.date ? booking.date.toLocaleDateString('es-ES', { month: 'long' }) : ''}
                                        </p>
                                        <p className="text-neutral-500 text-sm">
                                            De {booking.time} a {(() => {
                                                if (!booking.time) return '';
                                                const [h, m] = booking.time.split(':').map(Number);
                                                const end = new Date();
                                                end.setHours(h);
                                                end.setMinutes(m + (booking.serviceDuration || 0));
                                                return `${end.getHours()}:${end.getMinutes().toString().padStart(2, '0')}`;
                                            })()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-2xl font-bold text-neutral-900">
                                        {((booking.servicePrice ?? 0) / 100).toFixed(0)}€
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-neutral-100 md:static md:bg-transparent md:border-t-0 md:p-0 z-50 md:pt-4">
                    <button
                        type="button"
                        onClick={handleBack}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors bg-white shrink-0 disabled:opacity-50"
                    >
                        <ArrowLeft size={18} />
                        <span className="text-sm font-medium">Volver</span>
                    </button>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-neutral-800 transition-all flex justify-center items-center gap-2 shadow-md min-w-[200px]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                <span>Procesando...</span>
                            </>
                        ) : (
                            <span className="whitespace-nowrap text-sm md:text-base">Finalizar Reserva</span>
                        )}
                    </button>
                </div>
            </motion.form>
        </div>
    );
}
