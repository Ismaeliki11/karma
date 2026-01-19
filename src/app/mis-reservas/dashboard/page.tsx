import { verifyMagicLink } from '@/actions/auth';
import { getClientBookings, cancelClientBooking } from '@/actions/client-bookings';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, MapPin, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { DashboardClient } from './client';

// Edge Runtime compatible


export default async function DashboardPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    const token = typeof searchParams.token === 'string' ? searchParams.token : undefined;
    const rescheduled = searchParams.rescheduled === 'true';

    if (!token) {
        redirect('/mis-reservas');
    }

    const verification = await verifyMagicLink(token);

    if (!verification.success || !verification.email) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-4 text-center">
                <div className="p-4 bg-red-50 text-red-600 rounded-full">
                    <AlertCircle size={32} />
                </div>
                <h1 className="text-xl font-medium">Enlace inválido o caducado</h1>
                <p className="text-neutral-500 max-w-sm px-4">
                    El enlace que has usado no es válido o ya ha expirado. Por favor, solicita uno nuevo.
                </p>
                <Link href="/mis-reservas" className="bg-black text-white px-6 py-2 rounded-full text-sm font-medium">
                    Volver a solicitar
                </Link>
            </div>
        );
    }

    const { bookings: clientBookings, error } = await getClientBookings(verification.email);

    return (
        <div className="min-h-screen bg-[#FDFBF9] pb-20 selection:bg-black selection:text-white">
            {/* Elegant Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-neutral-100 sticky top-0 z-10 transition-all duration-300">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <p className="text-neutral-400 text-[10px] font-medium tracking-[0.2em] uppercase">Panel de Cliente</p>
                        </div>
                        <h1 className="text-xl md:text-2xl font-light text-neutral-900 tracking-tight">
                            Hola, <span className="font-normal">{verification.email.split('@')[0]}</span>
                        </h1>
                    </div>
                    <Link
                        href="/"
                        className="group flex items-center gap-2 text-xs font-medium text-neutral-500 hover:text-black transition-all bg-white hover:bg-neutral-50 px-4 py-2 rounded-full border border-neutral-100 hover:border-neutral-200 shadow-sm"
                    >
                        <span>Inicio</span>
                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </div>

            {/* Content Container */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                {rescheduled && (
                    <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3 text-emerald-800 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="bg-emerald-100 p-2 rounded-full h-fit text-emerald-600">
                            <ArrowRight className="rotate-[-45deg]" size={16} />
                        </div>
                        <div>
                            <p className="font-medium">¡Reserva modificada!</p>
                            <p className="text-sm text-emerald-600/80 mt-1">
                                Hemos enviado un correo con los detalles actualizados.
                            </p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-50/50 border border-red-100 text-red-600 rounded-2xl text-sm flex items-center gap-3 mb-8">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <DashboardClient
                    bookings={(clientBookings || []).map(b => ({
                        ...b,
                        serviceName: b.serviceName || 'Servicio Desconocido',
                        servicePrice: b.servicePrice || 0,
                        serviceDuration: b.serviceDuration || 0,
                        startAt: b.startAt.toISOString(),
                        createdAt: b.createdAt.toISOString()
                    }))}
                    userEmail={verification.email!}
                />
            </div>
        </div>
    );
}
