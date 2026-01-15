'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, XCircle, Edit2, ChevronRight, X, AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActionConfirmModal } from './ActionConfirmModal';
import { cancelClientBooking, deleteClientBooking } from '@/actions/client-bookings';
import { toast } from "sonner";

interface Booking {
    id: string;
    locator: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    serviceName: string;
    servicePrice: number;
    status: string;
}

export function ReservationCard({ booking, userEmail, isPast = false }: { booking: Booking, userEmail: string, isPast?: boolean }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCancelled, setIsCancelled] = useState(booking.status === 'CANCELLED');
    const [confirmAction, setConfirmAction] = useState<'cancel' | 'delete' | null>(null);
    const router = useRouter();

    const dateObj = new Date(booking.date);

    // Status Logic
    let statusText = 'Confirmada';
    let statusColorClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';
    let statusDotClass = 'bg-emerald-500';

    if (isCancelled) {
        statusText = 'Cancelada';
        statusColorClass = 'bg-neutral-100 text-neutral-400 border-neutral-200';
        statusDotClass = 'bg-neutral-400';
    } else if (isPast) {
        statusText = 'Completada';
        statusColorClass = 'bg-blue-50 text-blue-700 border-blue-100';
        statusDotClass = 'bg-blue-500';
    }

    const handleCancel = async () => {
        setIsProcessing(true);
        try {
            const res = await cancelClientBooking(booking.id, userEmail);
            if (res.success) {
                setIsCancelled(true);
                setIsModalOpen(false);
                setConfirmAction(null);
                router.refresh();
                toast.success("Cita cancelada correctamente");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al cancelar la cita");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReactivate = async () => {
        setIsProcessing(true);
        try {
            // Call API directly to Reactivate
            const res = await fetch('/api/bookings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: booking.id,
                    status: 'CONFIRMED'
                    // We don't send date/time, so backend uses current values 
                    // BUT our new logic in route.ts will trigger validation because of status change!
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error || "No se pudo reactivar la cita", {
                    description: "El hueco podría estar ocupado."
                });
                return;
            }

            setIsCancelled(false);
            setIsModalOpen(false);
            router.refresh();
            toast.success("¡Cita reactivada con éxito!", {
                description: "Ya vuelve a estar en tu calendario."
            });

        } catch (error) {
            console.error(error);
            toast.error("Ocurrió un error al reactivar.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReschedule = () => {
        const currentUrl = new URL(window.location.href);
        const token = currentUrl.searchParams.get('token');
        // If we have token, keep it. If not, use locator as 'code' param.
        const queryParam = token ? `token=${token}` : `code=${booking.locator}`;
        router.push(`/mis-reservas/reprogramar/${booking.id}?${queryParam}`);
    };

    const handleChangeService = () => {
        const currentUrl = new URL(window.location.href);
        const token = currentUrl.searchParams.get('token');
        const queryParam = token ? `token=${token}` : `code=${booking.locator}`;
        router.push(`/mis-reservas/cambiar-servicio/${booking.id}?${queryParam}`);
    };

    const handleDelete = async () => {
        setIsProcessing(true);
        try {
            await deleteClientBooking(booking.id, userEmail);
            setIsModalOpen(false);
            setConfirmAction(null);
            router.refresh();
            toast.success("Reserva eliminada del historial");
        } catch (error) {
            console.error(error);
            toast.error("No se pudo eliminar la reserva");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                    group relative overflow-hidden bg-white rounded-[2rem] p-6 transition-all duration-500
                    ${isCancelled
                        ? 'border border-dashed border-neutral-200 bg-neutral-50/50'
                        : 'border border-solid border-neutral-100 hover:border-neutral-200 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)]'
                    }
                `}
            >
                <div className="flex justify-between items-start mb-6">
                    <h3 className={`text-xl font-medium leading-tight flex items-center ${isCancelled ? 'text-neutral-400' : 'text-neutral-900'}`}>
                        {booking.serviceName}
                    </h3>
                    <div className="text-right">
                        <span className={`block text-lg font-semibold ${isCancelled ? 'text-neutral-300' : 'text-neutral-900'}`}>
                            {(booking.servicePrice / 100).toFixed(2)}€
                        </span>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <div className={`
                        flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border w-fit
                        ${statusColorClass}
                    `}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`}></span>
                        {statusText}
                    </div>
                    <span className="text-[10px] text-neutral-300 font-mono tracking-wider">#{booking.locator}</span>
                </div>

                <div className="space-y-4 mb-8">
                    <div className={`flex items-center gap-3 text-sm transition-colors ${isCancelled ? 'text-neutral-400' : 'text-neutral-600 group-hover:text-neutral-900'}`}>
                        <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center shrink-0">
                            <Calendar size={14} className={isCancelled ? "text-neutral-300" : "text-neutral-400"} />
                        </div>
                        <span className="capitalize font-medium border-b border-transparent group-hover:border-neutral-200 pb-0.5">
                            {format(dateObj, 'EEEE d MMMM', { locale: es })}
                        </span>
                    </div>
                    <div className={`flex items-center gap-3 text-sm transition-colors ${isCancelled ? 'text-neutral-400' : 'text-neutral-600 group-hover:text-neutral-900'}`}>
                        <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center shrink-0">
                            <Clock size={14} className={isCancelled ? "text-neutral-300" : "text-neutral-400"} />
                        </div>
                        <span className="font-medium bg-neutral-50 px-2 py-0.5 rounded-md">
                            {booking.time}
                        </span>
                    </div>
                </div>

                {!isPast && (
                    <div className="pt-4 border-t border-dashed border-neutral-100">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className={`
                                w-full text-xs font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border
                                ${isCancelled
                                    ? "text-neutral-400 bg-transparent border-neutral-200 hover:border-neutral-400 hover:text-neutral-600"
                                    : "text-neutral-600 bg-transparent border-transparent hover:bg-neutral-50 hover:text-black"
                                }
                            `}
                        >
                            <Edit2 size={14} />
                            {isCancelled ? 'GESTIONAR / REACTIVAR' : 'GESTIONAR RESERVA'}
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Premium Glass Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-white/20"
                        >
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h3 className="text-xl font-medium tracking-tight text-neutral-900">Gestionar Reserva</h3>
                                        <p className="text-sm text-neutral-400 mt-1">Elige una acción para tu cita</p>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-black transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Option 1: Reactivate (if cancelled) OR Reschedule */}
                                    {isCancelled ? (
                                        <button
                                            onClick={handleReactivate}
                                            disabled={isProcessing}
                                            className="w-full flex items-center justify-between p-5 rounded-3xl border border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50 hover:border-emerald-200 transition-all group text-left"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                                                    <CheckCircle2 size={24} />
                                                </div>
                                                <div>
                                                    <span className="block font-medium text-emerald-900 text-lg">Reactivar Cita</span>
                                                    <span className="text-sm text-emerald-600/80">Recuperar tu hueco si está libre</span>
                                                </div>
                                            </div>
                                            {isProcessing ? <div className="w-10 h-10 flex items-center justify-center"><div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div> : <ChevronRight size={20} className="text-emerald-300 group-hover:text-emerald-600 transition-colors" />}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleReschedule}
                                            className="w-full flex items-center justify-between p-5 rounded-3xl border border-neutral-100 hover:border-black/10 hover:bg-neutral-50 transition-all group text-left"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                                                    <Edit2 size={24} />
                                                </div>
                                                <div>
                                                    <span className="block font-medium text-neutral-900 text-lg">Mover Cita</span>
                                                    <span className="text-sm text-neutral-500">Cambiar fecha u hora</span>
                                                </div>
                                            </div>
                                            <ChevronRight size={20} className="text-neutral-300 group-hover:text-black transition-colors" />
                                        </button>
                                    )}

                                    {/* Option 2: Change Service (If NOT cancelled, or as reactivation option?) 
                                        Let's show it if NOT cancelled. If cancelled, Reschedule/Reactivate is better.
                                    */}
                                    {!isCancelled && (
                                        <button
                                            onClick={handleChangeService}
                                            className="w-full flex items-center justify-between p-5 rounded-3xl border border-neutral-100 hover:border-black/10 hover:bg-neutral-50 transition-all group text-left"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm">
                                                    <Edit2 size={24} />
                                                </div>
                                                <div>
                                                    <span className="block font-medium text-neutral-900 text-lg">Cambiar servicio</span>
                                                    <span className="text-sm text-neutral-500">Elegir otro tratamiento</span>
                                                </div>
                                            </div>
                                            <ChevronRight size={20} className="text-neutral-300 group-hover:text-black transition-colors" />
                                        </button>
                                    )}

                                    {/* Option 2: Always show Reschedule (even if cancelled, as a way to re-book) */}
                                    {isCancelled && (
                                        <button
                                            onClick={handleReschedule}
                                            className="w-full flex items-center justify-between p-5 rounded-3xl border border-neutral-100 hover:border-black/10 hover:bg-neutral-50 transition-all group text-left"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-600 flex items-center justify-center shadow-sm">
                                                    <Calendar size={24} />
                                                </div>
                                                <div>
                                                    <span className="block font-medium text-neutral-900 text-lg">Buscar otro día</span>
                                                    <span className="text-sm text-neutral-500">Programar nueva fecha</span>
                                                </div>
                                            </div>
                                            <ChevronRight size={20} className="text-neutral-300 group-hover:text-black transition-colors" />
                                        </button>
                                    )}

                                    {/* Option 3: Cancel (Only if NOT cancelled) */}
                                    {!isCancelled && (
                                        <button
                                            onClick={() => setConfirmAction('cancel')}
                                            disabled={isProcessing}
                                            className="w-full flex items-center justify-between p-5 rounded-3xl border border-neutral-100 hover:border-red-200 hover:bg-red-50/50 transition-all group text-left"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shadow-sm">
                                                    <XCircle size={24} />
                                                </div>
                                                <div>
                                                    <span className="block font-medium text-neutral-900 group-hover:text-red-700 text-lg">Cancelar cita</span>
                                                    <span className="text-sm text-neutral-500 group-hover:text-red-500">No podré asistir</span>
                                                </div>
                                            </div>
                                            {isProcessing ? <div className="w-10 h-10 flex items-center justify-center"><div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div> : <ChevronRight size={20} className="text-neutral-300 group-hover:text-red-400 transition-colors" />}
                                        </button>
                                    )}

                                    {/* Option 4: DELETE (Only if CANCELLED) */}
                                    {isCancelled && (
                                        <button
                                            onClick={() => setConfirmAction('delete')}
                                            disabled={isProcessing}
                                            className="w-full flex items-center justify-between p-5 rounded-3xl border border-neutral-100 hover:border-neutral-300 hover:bg-neutral-50 transition-all group text-left"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-500 flex items-center justify-center shadow-sm">
                                                    <Trash2 size={24} />
                                                </div>
                                                <div>
                                                    <span className="block font-medium text-neutral-900 group-hover:text-neutral-700 text-lg">Eliminar</span>
                                                    <span className="text-sm text-neutral-500">Borrar de mi lista</span>
                                                </div>
                                            </div>
                                            <ChevronRight size={20} className="text-neutral-300 group-hover:text-neutral-500 transition-colors" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="bg-neutral-50/80 p-5 text-center backdrop-blur-md">
                                <p className="text-xs text-neutral-400 font-medium tracking-wide">
                                    KARMA BEAUTY SALON
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ActionConfirmModal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={() => {
                    if (confirmAction === 'cancel') handleCancel();
                    if (confirmAction === 'delete') handleDelete();
                }}
                isProcessing={isProcessing}
                variant="danger"
                title={confirmAction === 'cancel' ? "¿Cancelar Cita?" : "¿Eliminar Reserva?"}
                description={confirmAction === 'cancel'
                    ? (
                        <div className="space-y-3">
                            <p>Al cancelar liberarás el hueco para otra persona. Podrás reactivarla más tarde si cambia de opinión.</p>
                            <div className="text-amber-600 bg-amber-50 p-2 rounded-lg text-xs text-left flex gap-2 items-start border border-amber-100">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <span>Te enviaremos un correo de confirmación. <strong>Revisa tu Spam</strong> si no lo recibes.</span>
                            </div>
                        </div>
                    )
                    : "Esta acción no se puede deshacer. La reserva desaparecerá de tu historial."}
                confirmText={confirmAction === 'cancel' ? "Sí, Cancelar" : "Sí, Eliminar"}
            />
        </>
    );
}
