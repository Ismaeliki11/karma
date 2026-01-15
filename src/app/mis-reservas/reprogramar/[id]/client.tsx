'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { getServiceById } from '@/lib/services';
import { toast } from "sonner";

interface Props {
    booking: {
        id: string;
        locator: string; // Added locator
        date: string;
        time: string;
        serviceId: string;
        serviceName: string;
        serviceDuration: number;
    };
    token?: string;
    userEmail: string;
}

export function RescheduleClient({ booking: initialBooking, token, userEmail }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const newServiceId = searchParams?.get('newServiceId');
    const timeSlotsRef = useRef<HTMLDivElement>(null);

    // Determine effective service (Original or New)
    const effectiveService = newServiceId ? getServiceById(newServiceId) : null;

    // Derived values
    const serviceId = effectiveService?.id || initialBooking.serviceId;
    const serviceName = effectiveService?.name || initialBooking.serviceName;
    const serviceDuration = effectiveService?.duration || initialBooking.serviceDuration;

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // State for dynamic slots
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [slotsError, setSlotsError] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch slots when Date changes
    useEffect(() => {
        const fetchSlots = async () => {
            if (!selectedDate) {
                setAvailableSlots([]);
                return;
            }

            setIsLoadingSlots(true);
            setSlotsError(null);
            setSelectedTime(null); // Reset time when date changes

            try {
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                const res = await fetch(`/api/availability?date=${dateStr}&serviceId=${serviceId}`);

                if (!res.ok) {
                    throw new Error('Error al obtener disponibilidad');
                }

                const data = await res.json();
                setAvailableSlots(data.slots || []);
            } catch (err) {
                console.error(err);
                setSlotsError('No se pudieron cargar los horarios.');
                setAvailableSlots([]);
            } finally {
                setIsLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [selectedDate, serviceId]);

    // Auto-scroll when slots load
    useEffect(() => {
        if (availableSlots.length > 0 && timeSlotsRef.current) {
            setTimeout(() => {
                timeSlotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [availableSlots]);

    const handleConfirm = async () => {
        if (!selectedDate || !selectedTime) return;

        setIsSubmitting(true);
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');

            const payload: any = {
                id: initialBooking.id,
                date: dateStr,
                startTime: selectedTime,
            };

            if (newServiceId && newServiceId !== initialBooking.serviceId) {
                payload.serviceId = newServiceId;
                payload.serviceName = serviceName;
            }

            const res = await fetch('/api/bookings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al reprogramar');
            }

            // Success! Redirect to dashboard OR single view
            if (token) {
                router.push(`/mis-reservas/dashboard?token=${token}&rescheduled=true`);
            } else {
                router.push(`/mis-reservas/reserva/${initialBooking.locator}?rescheduled=true`);
            }
            router.refresh();

        } catch (error: any) {
            toast.error(error.message || 'Error al reprogramar');
            setIsSubmitting(false);
        }
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(addMonths(currentMonth, -1));

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    return (
        <div className="min-h-screen bg-[#FDFBF9] pb-32 selection:bg-black selection:text-white">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-neutral-100 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 hover:bg-neutral-50 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-sm font-medium uppercase tracking-wide text-neutral-500">Reprogramar Cita</h1>
                    <div className="w-8"></div> {/* Spacer */}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

                {/* Info Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex items-start gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <CalendarIcon size={24} />
                    </div>
                    <div>
                        <h2 className="font-medium text-lg text-neutral-900">
                            {serviceName}
                        </h2>
                        <div className="flex gap-2 text-sm mt-1">
                            <span className="text-neutral-500">
                                {newServiceId ? 'Nuevo servicio seleccionado' : `Cita actual: ${initialBooking.date}`}
                            </span>
                            {newServiceId && (
                                <span className="bg-emerald-100 text-emerald-700 px-2 rounded-md text-xs font-bold flex items-center">
                                    {serviceDuration} min
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    {/* Calendar */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-medium capitalize">
                                {format(currentMonth, 'MMMM yyyy', { locale: es })}
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={prevMonth}
                                    className="p-2 hover:bg-neutral-100 rounded-full disabled:opacity-30"
                                    disabled={isBefore(endOfMonth(addMonths(currentMonth, -1)), startOfDay(new Date()))}
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button onClick={nextMonth} className="p-2 hover:bg-neutral-100 rounded-full">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-2 text-center text-sm mb-2 text-neutral-400 font-medium">
                            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => <div key={d}>{d}</div>)}
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {Array.from({ length: (startOfMonth(currentMonth).getDay() + 6) % 7 }).map((_, i) => (
                                <div key={`pad-${i}`} />
                            ))}

                            {days.map((day) => {
                                const isDisabled = isBefore(day, startOfDay(new Date()));
                                const isSelected = selectedDate && isSameDay(day, selectedDate);
                                const isCurrentBookingDate = isSameDay(day, new Date(initialBooking.date));

                                return (
                                    <button
                                        key={day.toISOString()}
                                        onClick={() => !isDisabled && setSelectedDate(day)}
                                        disabled={isDisabled}
                                        className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center transition-all text-sm relative",
                                            isSelected ? "bg-black text-white" : "hover:bg-neutral-100",
                                            (isToday(day) && !isSelected) && "text-black font-semibold ring-1 ring-neutral-200",
                                            isCurrentBookingDate && !isSelected && "bg-blue-50 text-blue-600 font-medium",
                                            isDisabled && "text-neutral-300 cursor-not-allowed hover:bg-transparent"
                                        )}
                                    >
                                        {format(day, 'd')}
                                        {isToday(day) && !isSelected && (
                                            <span className="absolute -bottom-1 w-1 h-1 bg-black rounded-full"></span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Time Slots */}
                    <div className="space-y-4" ref={timeSlotsRef}>
                        <h3 className="font-medium text-lg">Horarios disponibles</h3>
                        {!selectedDate ? (
                            <div className="h-40 flex items-center justify-center border-2 border-dashed border-neutral-100 rounded-xl text-neutral-400 text-sm">
                                Selecciona un día para ver horas
                            </div>
                        ) : isLoadingSlots ? (
                            <div className="h-40 flex items-center justify-center border border-neutral-100 rounded-xl">
                                <Loader2 className="animate-spin text-neutral-400" />
                            </div>
                        ) : slotsError ? (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center">
                                {slotsError}
                            </div>
                        ) : availableSlots.length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center border border-neutral-100 rounded-xl text-neutral-500 text-sm gap-2">
                                <span>No hay huecos disponibles.</span>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-2 gap-3"
                            >
                                {availableSlots.map(time => (
                                    <button
                                        key={time}
                                        onClick={() => setSelectedTime(time)}
                                        className={cn(
                                            "py-3 px-4 rounded-xl border transition-all text-sm font-medium",
                                            selectedTime === time
                                                ? "bg-black text-white border-black"
                                                : "bg-white text-neutral-700 border-neutral-200 hover:border-black"
                                        )}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-neutral-100 flex justify-between gap-3 md:justify-end z-50">
                <button
                    onClick={() => router.back()}
                    className="md:hidden flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-neutral-200 text-neutral-600"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={!selectedDate || !selectedTime || isSubmitting}
                    className={cn(
                        "flex-1 md:flex-none flex justify-center items-center gap-2 px-8 py-3 rounded-full transition-all duration-300 font-medium shadow-md text-white md:min-w-[200px]",
                        (!selectedDate || !selectedTime || isSubmitting)
                            ? "bg-neutral-300 cursor-not-allowed"
                            : "bg-black hover:bg-neutral-800"
                    )}
                >
                    {isSubmitting ? (
                        <Loader2 className="animate-spin" size={18} />
                    ) : (
                        <>
                            <span className="md:hidden">Confirmar</span>
                            <span className="hidden md:inline">Confirmar Cambio</span>
                            <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
