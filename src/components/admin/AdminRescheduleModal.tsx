"use client";

import { useState, useEffect, useRef } from "react";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon, CheckCircle2, X, Clock, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useServices } from "@/hooks/useServices";

interface Booking {
    id: string;
    date: string;
    startTime: string;
    serviceId: string;
    serviceName: string;
    servicePrice: number;
    // Add other fields if needed for display
}

interface AdminRescheduleModalProps {
    booking: Booking;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    startAtService?: boolean;
}

export function AdminRescheduleModal({ booking, isOpen, onClose, onSuccess, startAtService = false }: AdminRescheduleModalProps) {
    const [step, setStep] = useState<"service" | "datetime">(startAtService ? "service" : "datetime");

    // Service State
    const [selectedServiceId, setSelectedServiceId] = useState(booking.serviceId);

    // Date/Time State
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // Slots State
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [slotsError, setSlotsError] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const timeSlotsRef = useRef<HTMLDivElement>(null);

    // Services Hook
    const { categories, getServiceById, loading: loadingServices } = useServices();

    // Initial Setup
    useEffect(() => {
        if (isOpen) {
            setSelectedServiceId(booking.serviceId);
            setSelectedDate(null);
            setSelectedTime(null);
            setStep(startAtService ? "service" : "datetime");
            setCurrentMonth(new Date());
        }
    }, [isOpen, booking, startAtService]);

    // Derived Service Info
    const selectedService = getServiceById(selectedServiceId);

    // Fetch Slots
    useEffect(() => {
        const fetchSlots = async () => {
            if (!selectedDate) {
                setAvailableSlots([]);
                return;
            }

            setIsLoadingSlots(true);
            setSlotsError(null);
            setSelectedTime(null);

            try {
                const dateStr = format(selectedDate, "yyyy-MM-dd");
                const res = await fetch(`/api/availability?date=${dateStr}&serviceId=${selectedServiceId}`);

                if (!res.ok) throw new Error("Error al obtener disponibilidad");

                const data = await res.json();
                setAvailableSlots(data.slots || []);
            } catch (err) {
                console.error(err);
                setSlotsError("No se pudieron cargar los horarios.");
                setAvailableSlots([]);
            } finally {
                setIsLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [selectedDate, selectedServiceId]);

    // Auto-scroll to slots
    useEffect(() => {
        if (availableSlots.length > 0 && timeSlotsRef.current) {
            timeSlotsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [availableSlots]);

    const handleConfirm = async () => {
        if (!selectedDate || !selectedTime) return;

        setIsSubmitting(true);
        try {
            const dateStr = format(selectedDate, "yyyy-MM-dd");
            const payload = {
                id: booking.id,
                date: dateStr,
                startTime: selectedTime,
                serviceId: selectedServiceId,
                serviceName: selectedService?.name || booking.serviceName, // Update name if changed
                // Price should be handled by backend or updated here if schema requires it
                // For now, let's assume backend might update price based on serviceId or we send it
                servicePrice: selectedService?.price
            };

            const res = await fetch("/api/bookings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al reprogramar");
            }

            onSuccess();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(addMonths(currentMonth, -1));

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <h3 className="font-bold text-lg">
                        {step === 'service' ? 'Seleccionar Servicio' : 'Seleccionar Fecha y Hora'}
                    </h3>
                    {step === 'datetime' && startAtService && (
                        <div className="hidden"></div> // Logic placeholder: maybe Back button here if needed
                    )}
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Wizard Step 1: Service Selection */}
                    {step === "service" && (
                        <div className="space-y-8 animate-in slide-in-from-right duration-300">
                            {loadingServices ? (
                                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-gray-400" /></div>
                            ) : (
                                <div className="space-y-6">
                                    {categories.map((category) => (
                                        <div key={category.title} className="space-y-4">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{category.title}</h4>
                                            <div className="grid grid-cols-1 gap-3">
                                                {category.services.map((service) => (
                                                    <div
                                                        key={service.id}
                                                        onClick={() => {
                                                            setSelectedServiceId(service.id);
                                                            setStep("datetime");
                                                        }}
                                                        className={cn(
                                                            "cursor-pointer group relative overflow-hidden rounded-xl border transition-all duration-300 flex bg-white hover:shadow-md",
                                                            selectedServiceId === service.id
                                                                ? "border-black ring-1 ring-black bg-neutral-50"
                                                                : "border-gray-100 hover:border-gray-300"
                                                        )}
                                                    >
                                                        <div className="w-20 sm:w-24 relative aspect-square shrink-0 bg-gray-100">
                                                            {service.imageUrl && (
                                                                <Image
                                                                    src={service.imageUrl}
                                                                    alt={service.name}
                                                                    fill
                                                                    className="object-cover"
                                                                    sizes="(max-width: 768px) 96px, 128px"
                                                                />
                                                            )}
                                                        </div>

                                                        <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center">
                                                            <div className="flex justify-between items-start gap-2">
                                                                <h3 className="font-bold text-sm sm:text-base leading-tight text-gray-900 line-clamp-1">{service.name}</h3>
                                                                {selectedServiceId === service.id && (
                                                                    <CheckCircle2 size={16} className="text-black shrink-0" />
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                                                {service.description}
                                                            </p>
                                                            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-gray-400">
                                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                                                    {service.duration} min
                                                                </span>
                                                                <span>•</span>
                                                                <span>{(service.price / 100).toFixed(2)}€</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Wizard Step 2: Date & Time */}
                    {step === "datetime" && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-300">

                            {/* Selected Service Summary Header */}
                            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-gray-200">
                                        {selectedService?.imageUrl && (
                                            <Image
                                                src={selectedService.imageUrl}
                                                alt={selectedService?.name || 'Service'}
                                                fill
                                                className="object-cover"
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">{selectedService?.name}</p>
                                        <p className="text-xs text-gray-500">{selectedService?.duration} min • {(selectedService?.price || 0) / 100}€</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStep("service")}
                                    className="text-xs font-medium text-blue-600 hover:underline hover:text-blue-800"
                                >
                                    Cambiar
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Calendar */}
                                <div className="bg-white rounded-xl border border-gray-100 p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="font-medium capitalize text-gray-900">
                                            {format(currentMonth, 'MMMM yyyy', { locale: es })}
                                        </span>
                                        <div className="flex gap-1">
                                            <button onClick={prevMonth} disabled={isBefore(endOfMonth(addMonths(currentMonth, -1)), startOfDay(new Date()))} className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-30">
                                                <ChevronLeft size={20} />
                                            </button>
                                            <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-full">
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-gray-400 font-medium">
                                        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d}>{d}</div>)}
                                    </div>

                                    <div className="grid grid-cols-7 gap-1">
                                        {Array.from({ length: (startOfMonth(currentMonth).getDay() + 6) % 7 }).map((_, i) => (
                                            <div key={`pad-${i}`} />
                                        ))}
                                        {days.map((day) => {
                                            const isDisabled = isBefore(day, startOfDay(new Date()));
                                            const isSelected = selectedDate && isSameDay(day, selectedDate);

                                            return (
                                                <button
                                                    key={day.toISOString()}
                                                    onClick={() => !isDisabled && setSelectedDate(day)}
                                                    disabled={isDisabled}
                                                    className={cn(
                                                        "h-8 w-8 rounded-full flex items-center justify-center text-sm transition-all relative",
                                                        isSelected ? "bg-black text-white" : "hover:bg-gray-100",
                                                        isToday(day) && !isSelected && "text-black font-bold ring-1 ring-gray-200",
                                                        isDisabled && "text-gray-300 cursor-not-allowed hover:bg-transparent"
                                                    )}
                                                >
                                                    {format(day, 'd')}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Slots */}
                                <div className="flex flex-col h-full min-h-[300px]" ref={timeSlotsRef}>
                                    <h4 className="font-medium mb-3 flex items-center gap-2">
                                        <Clock size={16} /> Horarios Disponibles
                                    </h4>

                                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                        {!selectedDate ? (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">
                                                <CalendarIcon size={32} className="mb-2 opacity-20" />
                                                Selecciona un día
                                            </div>
                                        ) : isLoadingSlots ? (
                                            <div className="h-full flex items-center justify-center">
                                                <Loader2 className="animate-spin text-gray-400" />
                                            </div>
                                        ) : availableSlots.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm bg-gray-50 rounded-xl p-4 text-center">
                                                <span>No hay huecos disponibles para este día.</span>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2">
                                                {availableSlots.map(time => (
                                                    <button
                                                        key={time}
                                                        onClick={() => setSelectedTime(time)}
                                                        className={cn(
                                                            "py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                                                            selectedTime === time
                                                                ? "bg-black text-white border-black shadow-md transform scale-[1.02]"
                                                                : "bg-white text-gray-700 border-gray-200 hover:border-black/30 hover:bg-gray-50"
                                                        )}
                                                    >
                                                        {time}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end gap-3">
                    {step === "datetime" && startAtService && (
                        <button
                            onClick={() => setStep("service")}
                            className="mr-auto px-4 py-2 text-sm font-medium text-gray-500 hover:text-black transition-colors flex items-center gap-1"
                        >
                            <ArrowLeft size={16} /> Volver
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-200/50 rounded-full transition-colors"
                    >
                        Cancelar
                    </button>
                    {step === "datetime" && (
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedDate || !selectedTime || isSubmitting}
                            className={cn(
                                "px-8 py-2.5 text-sm font-bold text-white rounded-full transition-all shadow-lg shadow-black/10 flex items-center gap-2",
                                (!selectedDate || !selectedTime || isSubmitting)
                                    ? "bg-gray-300 cursor-not-allowed"
                                    : "bg-black hover:bg-neutral-800 hover:scale-[1.02] active:scale-[0.98]"
                            )}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Confirmar Cambios"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
