
'use client';

import { useBooking } from '@/context/BookingContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function CalendarioPage() {
    const { booking, updateBooking } = useBooking();
    const router = useRouter();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // State for dynamic slots
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [slotsError, setSlotsError] = useState<string | null>(null);

    // State for Month Availability
    const [monthAvailability, setMonthAvailability] = useState<Record<string, { isOpen: boolean, reason?: string }>>({});
    const [isLoadingMonth, setIsLoadingMonth] = useState(false);

    useEffect(() => {
        if (!booking.serviceId) {
            router.push('/reserva/servicios');
        }
    }, [booking.serviceId, router]);

    // Fetch Month Availability when currentMonth changes
    useEffect(() => {
        const fetchMonthAvailability = async () => {
            setIsLoadingMonth(true);
            try {
                const year = currentMonth.getFullYear();
                const month = currentMonth.getMonth() + 1; // 1-12
                const res = await fetch(`/api/availability/month?year=${year}&month=${month}`);
                if (res.ok) {
                    const data = await res.json();
                    setMonthAvailability(data);
                }
            } catch (error) {
                console.error("Failed to load month availability");
            } finally {
                setIsLoadingMonth(false);
            }
        };
        fetchMonthAvailability();
    }, [currentMonth]);

    // Fetch slots when Date or Service changes
    useEffect(() => {
        const fetchSlots = async () => {
            if (!booking.date || !booking.serviceId) {
                setAvailableSlots([]);
                return;
            }

            setIsLoadingSlots(true);
            setSlotsError(null);

            try {
                const dateStr = format(booking.date, 'yyyy-MM-dd');
                const res = await fetch(`/api/availability?date=${dateStr}&serviceId=${booking.serviceId}`);

                if (!res.ok) {
                    throw new Error('Error al obtener disponibilidad');
                }

                const data = await res.json();
                setAvailableSlots(data.slots || []);
            } catch (err) {
                console.error(err);
                setSlotsError('No se pudieron cargar los horarios. Inténtalo de nuevo.');
                setAvailableSlots([]);
            } finally {
                setIsLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [booking.date, booking.serviceId]);

    if (!booking.serviceId) return null;

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    const handleDateSelect = (date: Date) => {
        updateBooking({ date, time: null }); // Reset time when date changes

        // Mobile-only smooth scroll to time slots
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setTimeout(() => {
                const element = document.getElementById('time-slots-section');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    };

    const handleTimeSelect = (time: string) => {
        updateBooking({ time });
    };

    const handleNext = () => {
        if (booking.date && booking.time) {
            router.push('/reserva/datos');
        }
    };

    const handleBack = () => {
        router.push('/reserva/servicios');
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(addMonths(currentMonth, -1));

    return (
        <div className="space-y-6 md:space-y-8 max-w-4xl mx-auto pb-32 md:pb-0 px-2 md:px-0">
            <div className="text-center px-4">
                <h1 className="text-2xl md:text-3xl font-light tracking-wide text-neutral-900">Fecha y Hora</h1>
                <p className="mt-2 text-sm md:text-base text-neutral-500">Selecciona cuándo quieres venir</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                {/* Calendar Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 relative">
                    {isLoadingMonth && (
                        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-2xl">
                            <Loader2 className="animate-spin text-gray-400" />
                        </div>
                    )}

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
                        {/* Pad Start. 0=Sun (6), 1=Mon (0) */}
                        {Array.from({ length: (startOfMonth(currentMonth).getDay() + 6) % 7 }).map((_, i) => (
                            <div key={`pad-${i}`} />
                        ))}

                        {days.map((day) => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const dayInfo = monthAvailability[dateStr];

                            // It's disabled if:
                            // 1. It's in the past (handled by backend 'Pasado', but also visually here)
                            // 2. OR Backend says isOpen = false
                            // 3. OR Month data hasn't loaded (avoid flashing open days)
                            const isPast = isBefore(day, startOfDay(new Date()));
                            const isClosed = dayInfo ? !dayInfo.isOpen : false; // If loading/undefined, assume open or closed? Better to assume closed to avoid flicker or default.
                            // Actually, until data loads, we might want to disable everything? 
                            // Let's rely on dayInfo. If undefined (loading first time), maybe safer to disable.
                            const isDisabled = isPast || isClosed;

                            const isSelected = booking.date && isSameDay(day, booking.date);

                            return (
                                <button
                                    key={day.toISOString()}
                                    onClick={() => !isDisabled && handleDateSelect(day)}
                                    disabled={isDisabled}
                                    title={dayInfo?.reason}
                                    className={cn(
                                        "h-10 w-10 rounded-full flex items-center justify-center transition-all text-sm relative",
                                        isSelected ? "bg-black text-white" : isDisabled ? "text-neutral-300 cursor-not-allowed hover:bg-transparent bg-gray-50/50" : "hover:bg-neutral-100 text-neutral-900",
                                        isToday(day) && !isSelected && "text-black font-semibold ring-1 ring-neutral-200",
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

                {/* Time Selection */}
                <div id="time-slots-section" className="space-y-4 scroll-mt-24">
                    <h3 className="font-medium text-lg">Horarios disponibles</h3>
                    {!booking.date ? (
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
                            <span>No hay huecos disponibles este día.</span>
                            <span className="text-xs text-neutral-400">Prueba con otra fecha.</span>
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
                                    onClick={() => handleTimeSelect(time)}
                                    className={cn(
                                        "py-3 px-4 rounded-xl border transition-all text-sm font-medium",
                                        booking.time === time
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

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-neutral-100 flex justify-between gap-3 md:static md:bg-transparent md:border-t-0 md:p-0 z-50">
                <button
                    onClick={handleBack}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors bg-white shrink-0"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Volver</span>
                </button>
                <button
                    onClick={handleNext}
                    disabled={!booking.date || !booking.time}
                    className={cn(
                        "flex-1 flex justify-center items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 font-medium shadow-md md:w-auto md:flex-none",
                        booking.date && booking.time
                            ? "bg-black text-white hover:bg-neutral-800"
                            : "bg-white text-neutral-300 border border-neutral-200 cursor-not-allowed"
                    )}
                >
                    <span className="whitespace-nowrap text-sm md:text-base">Continuar</span>
                    {booking.date && booking.time && (
                        <motion.span
                            initial={{ x: 0 }}
                            animate={{ x: 3 }}
                            transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.6 }}
                            className="shrink-0"
                        >
                            <ArrowRight size={18} />
                        </motion.span>
                    )}
                </button>
            </div>
        </div>
    );
}
