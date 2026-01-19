"use client";


import { Clock, Calendar, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { format, addDays, isSameDay, isWithinInterval, parseISO, getDay, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface BusinessDay {
    dayOfWeek: number;
    morningStart: string | null;
    morningEnd: string | null;
    afternoonStart: string | null;
    afternoonEnd: string | null;
    isClosed: boolean;
}

interface Exception {
    startDate: string;
    endDate: string;
    morningStart: string | null;
    morningEnd: string | null;
    afternoonStart: string | null;
    afternoonEnd: string | null;
    isClosed: boolean;
    reason: string | null;
}

interface DaySchedule {
    date: Date;
    dayName: string;
    hoursDisplay: string;
    isOpen: boolean;
    isException: boolean;
    note?: string;
}

export function Hours() {
    const [schedule, setSchedule] = useState<DaySchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [weeklyException, setWeeklyException] = useState<Exception | null>(null);
    const [futureException, setFutureException] = useState<Exception | null>(null);
    const [weekOffset, setWeekOffset] = useState(0);

    const [allHours, setAllHours] = useState<BusinessDay[]>([]);
    const [allExceptions, setAllExceptions] = useState<Exception[]>([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const [hoursRes, exceptionsRes] = await Promise.all([
                    fetch("/api/settings/business-hours"),
                    fetch("/api/settings/exceptions")
                ]);

                let bHours: BusinessDay[] = [];
                let exs: Exception[] = [];

                if (hoursRes.ok) bHours = await hoursRes.json();
                if (exceptionsRes.ok) exs = await exceptionsRes.json();

                setAllHours(bHours);
                setAllExceptions(exs);

                generateSchedule(bHours, exs, 0);
                detectFutureExceptions(exs);
            } catch (error) {
                console.error("Error loading schedule:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    // Update schedule when weekOffset changes
    useEffect(() => {
        if (allHours.length > 0 || allExceptions.length > 0) {
            generateSchedule(allHours, allExceptions, weekOffset);
        }
    }, [weekOffset]);

    const detectFutureExceptions = (exceptions: Exception[]) => {
        const today = startOfDay(new Date());
        const startOfNextPhase = addDays(today, 1); // Anything after today
        const endOfScan = addDays(today, 60); // Scan 2 months ahead

        const future = exceptions
            .filter(ex => {
                const exStart = parseISO(ex.startDate);
                const exEnd = parseISO(ex.endDate);
                return (exStart <= endOfScan && exEnd >= startOfNextPhase);
            })
            // Sort by start date to get the closest one
            .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime())
            .find(ex => {
                // Return the first one that is NOT in the current viewable week (if possible)
                // or just the absolute next one.
                const exStart = parseISO(ex.startDate);
                const endOfCurrentWeek = addDays(today, 7);
                return exStart > endOfCurrentWeek;
            });

        setFutureException(future || null);
    };

    const generateSchedule = (businessHours: BusinessDay[], exceptions: Exception[], offset: number) => {
        const today = startOfDay(new Date());
        const startDate = addDays(today, offset * 7);
        const daysToShow = 7;
        const generated: DaySchedule[] = [];
        let firstExceptionInView: Exception | null = null;

        for (let i = 0; i < daysToShow; i++) {
            const currentDate = addDays(startDate, i);
            const dayOfWeek = getDay(currentDate);

            const exception = exceptions.find(ex =>
                isWithinInterval(currentDate, { start: parseISO(ex.startDate), end: parseISO(ex.endDate) })
            );

            let hoursDisplay = "Cerrado";
            let isOpen = false;
            let note = "";
            let isException = false;

            if (exception) {
                isException = true;
                if (!firstExceptionInView) firstExceptionInView = exception;
                note = exception.reason || "Horario especial";
                if (exception.isClosed) {
                    isOpen = false;
                    hoursDisplay = "Cerrado";
                } else {
                    isOpen = true;
                    hoursDisplay = formatShifts(exception);
                }
            } else {
                const regular = businessHours.find(h => h.dayOfWeek === dayOfWeek);
                if (regular) {
                    if (regular.isClosed) {
                        isOpen = false;
                    } else {
                        isOpen = true;
                        hoursDisplay = formatShifts(regular);
                    }
                }
            }

            generated.push({
                date: currentDate,
                dayName: format(currentDate, "EEEE d", { locale: es }),
                hoursDisplay,
                isOpen,
                isException,
                note: isException ? note : undefined
            });
        }
        setSchedule(generated);
        setWeeklyException(firstExceptionInView);
    };

    const formatShifts = (day: { morningStart?: string | null, morningEnd?: string | null, afternoonStart?: string | null, afternoonEnd?: string | null }) => {
        const parts = [];
        if (day.morningStart && day.morningEnd) {
            parts.push(`${day.morningStart} – ${day.morningEnd}`);
        }
        if (day.afternoonStart && day.afternoonEnd) {
            parts.push(`${day.afternoonStart} – ${day.afternoonEnd}`);
        }
        return parts.length > 0 ? parts.join(" | ") : "Cerrado";
    };

    return (
        <section id="horario" className="py-16 md:py-24 bg-neutral-50 border-t border-neutral-100">
            <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-neutral-900">Horarios de Atención</h2>
                    <p className="text-neutral-500 text-lg">
                        Planifica tu visita. Te esperamos para dedicarte el tiempo que mereces.
                    </p>
                </div>

                <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl shadow-neutral-100/50 border border-neutral-200/60 transition-all hover:shadow-2xl hover:shadow-neutral-200/50 overflow-hidden">

                    {/* Future Exception Alert */}
                    {futureException && weekOffset === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-10 group relative"
                        >
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-indigo-500 to-violet-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                            <div className="relative bg-white border border-neutral-100 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                        <Calendar size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-neutral-500 mb-0.5">Próximo cambio detectado</p>
                                        <h4 className="text-neutral-900 font-bold flex items-center gap-2">
                                            {format(parseISO(futureException.startDate), "d 'de' MMMM", { locale: es })}
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                        </h4>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        const exDate = parseISO(futureException.startDate);
                                        const diff = exDate.getTime() - startOfDay(new Date()).getTime();
                                        const weekIdx = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
                                        setWeekOffset(weekIdx);
                                    }}
                                    className="w-full md:w-auto px-6 py-2.5 bg-neutral-900 text-white text-sm font-bold rounded-xl hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-200 flex items-center justify-center gap-2"
                                >
                                    Ver esa semana
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Current Week Exception Alert */}
                    {weeklyException && (
                        <div className="mb-8 p-5 bg-pink-50/50 border border-pink-100 rounded-2xl flex items-start gap-4 text-pink-900">
                            <div className="p-2.5 bg-white rounded-xl shadow-sm text-pink-500 border border-pink-100">
                                <AlertCircle className="shrink-0" size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
                                    <h4 className="font-bold text-xs uppercase tracking-widest text-pink-600">Aviso importante</h4>
                                </div>
                                <p className="text-[15px] font-medium leading-relaxed text-neutral-800">
                                    {weeklyException.isClosed
                                        ? `Estaremos cerrados temporalmente por: ${weeklyException.reason || 'Festivo'}.`
                                        : `Horario especial aplicado por: ${weeklyException.reason || 'Festivo'}.`
                                    }
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-neutral-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 bg-pink-50 rounded-2xl text-pink-500">
                                <Clock size={26} strokeWidth={2} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-neutral-900">Horario Semanal</h3>
                                <p className="text-neutral-500 text-sm font-medium">
                                    {weekOffset === 0 ? "Esta semana" : `Semana del ${format(schedule[0]?.date || new Date(), "d 'de' MMM", { locale: es })}`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
                                disabled={weekOffset === 0}
                                className={`p-2 rounded-full border transition-all ${weekOffset === 0 ? 'text-neutral-200 border-neutral-100' : 'text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:text-pink-500'}`}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={() => setWeekOffset(prev => prev + 1)}
                                className="p-2 rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-pink-500 transition-all"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="relative">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={weekOffset}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-3"
                            >
                                {isLoading ? (
                                    <div className="text-center py-8 text-neutral-400">Cargando horarios...</div>
                                ) : (
                                    schedule.map((item, index) => {
                                        const isToday = weekOffset === 0 && index === 0;
                                        return (
                                            <div
                                                key={index}
                                                className={`
                                                    group flex flex-col sm:flex-row sm:items-center justify-between
                                                    p-4 rounded-xl transition-all duration-300 border
                                                    ${isToday
                                                        ? "bg-pink-50/60 border-pink-100 shadow-sm"
                                                        : item.isException && !item.isOpen
                                                            ? "bg-orange-50/40 border-orange-100 shadow-sm"
                                                            : "bg-transparent border-transparent hover:bg-neutral-50"
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                                    <div className={`
                                                        w-2 h-2 rounded-full ring-2 ring-white
                                                        ${item.isOpen ? "bg-emerald-400" : item.isException ? "bg-orange-400" : "bg-neutral-300"}
                                                    `} />
                                                    <div className="flex flex-col">
                                                        <span className={`
                                                            font-medium text-lg capitalize
                                                            ${isToday ? "text-pink-900" : "text-neutral-700 group-hover:text-neutral-900"}
                                                        `}>
                                                            {item.dayName} {isToday && <span className="text-xs font-bold text-pink-500 uppercase ml-2 bg-pink-100 px-2 py-0.5 rounded-full">Hoy</span>}
                                                        </span>
                                                        {item.isException && (
                                                            <span className="text-xs font-bold text-orange-600 flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full bg-orange-100/50 w-fit">
                                                                <AlertCircle size={10} />
                                                                {item.note}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className={`
                                                    pl-5 sm:pl-0 text-[15px] sm:text-base font-bold
                                                    ${item.isOpen ? "text-neutral-700" : "text-orange-600 italic"}
                                                `}>
                                                    {item.hoursDisplay}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
                        <p className="text-sm text-neutral-400 font-medium">
                            * Los horarios pueden variar en días festivos y puentes.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
