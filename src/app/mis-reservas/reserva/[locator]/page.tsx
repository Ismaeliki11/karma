import { getBookingByLocator } from '@/actions/client-bookings';
import { ReservationCard } from '@/components/ReservationCard';
import Link from 'next/link';
import { ArrowRight, AlertCircle } from 'lucide-react';



interface Props {
    params: Promise<{ locator: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SingleBookingPage(props: Props) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const { locator } = params;

    // Fetch booking
    const { booking, error } = await getBookingByLocator(locator);

    // Check for success param
    const rescheduled = searchParams?.rescheduled === 'true';

    if (error || !booking) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-4 text-center bg-[#FDFBF9]">
                <div className="p-4 bg-red-50 text-red-600 rounded-full">
                    <AlertCircle size={32} />
                </div>
                <h1 className="text-xl font-medium">Reserva no encontrada</h1>
                <p className="text-neutral-500 max-w-sm px-4">
                    No hemos encontrado ninguna reserva con el código <strong>{locator}</strong>.
                </p>
                <Link href="/mis-reservas" className="bg-black text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors">
                    Intentarlo de nuevo
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF9] pb-20 selection:bg-black selection:text-white">
            {/* Simple Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-neutral-100 sticky top-0 z-10">
                <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <p className="text-neutral-400 text-[10px] font-medium tracking-[0.2em] uppercase">Reserva Individual</p>
                    </div>
                    <Link
                        href="/mis-reservas"
                        className="group flex items-center gap-2 text-xs font-medium text-neutral-500 hover:text-black transition-all"
                    >
                        <span>Salir</span>
                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-xl mx-auto px-6 py-12">

                {rescheduled && (
                    <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3 text-emerald-800 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="bg-emerald-100 p-2 rounded-full h-fit text-emerald-600">
                            <ArrowRight className="rotate-[-45deg]" size={16} />
                        </div>
                        <div>
                            <p className="font-medium">¡Reserva modificada!</p>
                            <p className="text-sm text-emerald-600/80 mt-1">
                                Hemos enviado un correo con los detalles actualizados.
                                <br />
                                <span className="font-semibold">⚠️ Revisa tu carpeta de Spam si no te llega.</span>
                            </p>
                        </div>
                    </div>
                )}

                <div className="mb-8 text-center sm:text-left">
                    <h1 className="text-2xl font-light text-neutral-900 tracking-tight mb-2">
                        Reserva <span className="font-normal font-mono text-neutral-400">#{booking.locator}</span>
                    </h1>
                    <p className="text-neutral-500 text-sm">
                        Aquí tienes los detalles de tu cita. Puedes gestionarla desde aquí.
                    </p>
                </div>

                <ReservationCard
                    booking={{
                        ...booking,
                        serviceName: booking.serviceName || 'Servicio Desconocido',
                        servicePrice: booking.servicePrice || 0,
                    }}
                    userEmail={booking.customerEmail} // We trust the locator implies access
                    isPast={booking.startAt ? new Date(booking.startAt) < new Date() : false}
                />
            </div>
        </div>
    );
}
