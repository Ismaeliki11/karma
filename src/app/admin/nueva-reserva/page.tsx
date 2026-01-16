'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Search, User, Phone, Mail, Calendar, Clock, Loader2, Plus } from 'lucide-react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useServices, Service } from '@/hooks/useServices';
import Image from 'next/image';
import { toast } from 'sonner';

type Step = 'service' | 'datetime' | 'client' | 'confirm';

interface ClientShort {
    name: string;
    email: string;
    phone: string;
    lastVisit?: string;
}

export default function NewBookingPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('service');

    // Booking State
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [clientDetails, setClientDetails] = useState<ClientShort>({ name: '', email: '', phone: '' });
    const [notes, setNotes] = useState('');

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);

    const nextStep = () => {
        if (step === 'service' && selectedService) setStep('datetime');
        else if (step === 'datetime' && selectedDate && selectedTime) setStep('client');
        else if (step === 'client' && clientDetails.name && clientDetails.phone) setStep('confirm');
    };

    const prevStep = () => {
        if (step === 'datetime') setStep('service');
        else if (step === 'client') setStep('datetime');
        else if (step === 'confirm') setStep('client');
        else router.back();
    };

    const handleSubmit = async () => {
        if (!selectedService || !selectedDate || !selectedTime || !clientDetails.name || !clientDetails.phone) return;

        setIsSubmitting(true);
        try {
            const payload = {
                serviceId: selectedService.id,
                serviceName: selectedService.name,
                selectedOptions: [],
                date: format(selectedDate, 'yyyy-MM-dd'),
                time: selectedTime,
                customer: {
                    name: clientDetails.name,
                    email: clientDetails.email || '',
                    phone: clientDetails.phone
                },
                notes: notes,
                source: 'admin'
            };

            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error al crear la reserva');
            }

            toast.success('Reserva creada correctamente');
            router.push('/admin');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Error al crear la reserva');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-neutral-900">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={prevStep} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-black transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h1 className="font-semibold text-base md:text-lg tracking-tight">Nueva Reserva Manual</h1>
                            <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-400 uppercase tracking-widest font-medium mt-0.5">
                                <span className={cn(step === 'service' && "text-black")}>Servicio</span>
                                <ChevronRight size={10} />
                                <span className={cn(step === 'datetime' && "text-black")}>Fecha</span>
                                <ChevronRight size={10} />
                                <span className={cn(step === 'client' && "text-black")}>Cliente</span>
                                <ChevronRight size={10} />
                                <span className={cn(step === 'confirm' && "text-black")}>Fin</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 pb-32">
                <AnimatePresence mode="wait">
                    {step === 'service' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="step-service">
                            <StepServiceSelection
                                selectedId={selectedService?.id || null}
                                onSelect={setSelectedService}
                            />
                            {/* Floating Footer for Service Step */}
                            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-neutral-100 flex justify-center z-40">
                                <button
                                    onClick={nextStep}
                                    disabled={!selectedService}
                                    className={cn(
                                        "flex items-center justify-center gap-2 px-8 py-3 rounded-full transition-all duration-300 font-medium shadow-md w-full md:w-auto",
                                        selectedService
                                            ? "bg-black text-white hover:bg-neutral-800 scale-100"
                                            : "bg-white text-neutral-300 border border-neutral-200 cursor-not-allowed"
                                    )}
                                >
                                    <span>Continuar</span>
                                    {selectedService && <ChevronRight size={18} />}
                                </button>
                            </div>
                        </motion.div>
                    )}
                    {step === 'datetime' && selectedService && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="step-datetime">
                            <StepDateTimeSelection
                                serviceId={selectedService.id}
                                selectedDate={selectedDate}
                                selectedTime={selectedTime}
                                onDateSelect={(d) => { setSelectedDate(d); setSelectedTime(null); }}
                                onTimeSelect={(t) => { setSelectedTime(t); }}
                            />
                            {/* Floating Footer for Date Step */}
                            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-neutral-100 flex justify-center z-40 gap-3">
                                <button
                                    onClick={nextStep}
                                    disabled={!selectedDate || !selectedTime}
                                    className={cn(
                                        "flex items-center justify-center gap-2 px-8 py-3 rounded-full transition-all duration-300 font-medium shadow-md w-full md:w-auto",
                                        selectedDate && selectedTime
                                            ? "bg-black text-white hover:bg-neutral-800 scale-100"
                                            : "bg-white text-neutral-300 border border-neutral-200 cursor-not-allowed"
                                    )}
                                >
                                    <span>Continuar</span>
                                    {selectedDate && selectedTime && <ChevronRight size={18} />}
                                </button>
                            </div>
                        </motion.div>
                    )}
                    {step === 'client' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="step-client">
                            <StepClientSelection
                                currentClient={clientDetails}
                                notes={notes}
                                onClientChange={setClientDetails}
                                onNotesChange={setNotes}
                            />
                            {/* Floating Footer for Client Step */}
                            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-neutral-100 flex justify-center z-40 gap-3">
                                <button
                                    onClick={nextStep}
                                    disabled={!clientDetails.name || !clientDetails.phone}
                                    className={cn(
                                        "flex items-center justify-center gap-2 px-8 py-3 rounded-full transition-all duration-300 font-medium shadow-md w-full md:w-auto",
                                        clientDetails.name && clientDetails.phone
                                            ? "bg-black text-white hover:bg-neutral-800 scale-100"
                                            : "bg-white text-neutral-300 border border-neutral-200 cursor-not-allowed"
                                    )}
                                >
                                    <span>Revisar Reserva</span>
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                    {step === 'confirm' && selectedService && selectedDate && selectedTime && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key="step-confirm">
                            <StepConfirmation
                                service={selectedService}
                                date={selectedDate}
                                time={selectedTime}
                                client={clientDetails}
                                notes={notes}
                            />
                            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-neutral-100 flex justify-center z-40 gap-3">
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-10 py-3 rounded-full bg-black text-white font-medium hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-black/20 transition-all active:scale-[0.98]"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Procesando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Confirmar Reserva</span>
                                            <Check size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

// --- SUB COMPONENTS ---

function StepServiceSelection({ selectedId, onSelect }: { selectedId: string | null, onSelect: (s: Service) => void }) {
    const { categories, loading } = useServices(); // Use categories instead of services
    const [search, setSearch] = useState('');

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-300" size={32} /></div>;

    // Filter categories based on search
    const filteredCategories = categories.map(cat => ({
        ...cat,
        services: cat.services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    })).filter(cat => cat.services.length > 0);

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-light tracking-tight text-neutral-900">Selecciona un Servicio</h2>
                <p className="text-neutral-400">Elige el tratamiento para la cita</p>
            </div>

            <div className="relative max-w-md mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                <input
                    type="text"
                    placeholder="Buscar servicio..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 bg-white shadow-sm transition-shadow focus:shadow-md text-sm"
                />
            </div>

            <div className="space-y-12">
                {filteredCategories.map((category) => (
                    <div key={category.title} className="space-y-6">
                        <h3 className="text-lg font-medium border-b border-gray-100 pb-2 text-neutral-900">{category.title}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {category.services.map(service => (
                                <div
                                    key={service.id}
                                    onClick={() => onSelect(service)}
                                    className={cn(
                                        "cursor-pointer p-4 rounded-2xl border transition-all flex gap-4 items-center bg-white hover:border-black/30 group relative overflow-hidden active:scale-[0.99]",
                                        selectedId === service.id ? "border-black ring-1 ring-black shadow-lg shadow-black/5" : "border-gray-100 shadow-sm"
                                    )}
                                >
                                    <div className="w-20 h-20 bg-gray-100 rounded-xl shrink-0 relative overflow-hidden">
                                        {service.imageUrl ? (
                                            <Image src={service.imageUrl} alt={service.name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Sin foto</div>
                                        )}

                                        {/* Overlay Check for better visibility */}
                                        <AnimatePresence>
                                            {selectedId === service.id && (
                                                <motion.div
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                    className="absolute inset-0 bg-black/40 flex items-center justify-center"
                                                >
                                                    <Check className="text-white drop-shadow-md" size={24} />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="flex-1 min-w-0 py-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className="font-semibold text-neutral-900 leading-tight">{service.name}</h4>
                                            <span className="font-bold text-neutral-900 shrink-0">{(service.price / 100).toFixed(0)}€</span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-2 text-xs font-medium text-neutral-500 bg-neutral-50 px-2 py-1 rounded-md w-fit">
                                            <Clock size={12} />
                                            <span>{service.duration} min</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {filteredCategories.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <p>No se encontraron servicios que coincidan con "{search}"</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function StepDateTimeSelection({ serviceId, selectedDate, selectedTime, onDateSelect, onTimeSelect }: {
    serviceId: string;
    selectedDate: Date | null;
    selectedTime: string | null;
    onDateSelect: (d: Date) => void;
    onTimeSelect: (t: string) => void;
}) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [monthAvailability, setMonthAvailability] = useState<Record<string, { isOpen: boolean, reason?: string }>>({});
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    useEffect(() => {
        const fetchMonthAvailability = async () => {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth() + 1;
            const res = await fetch(`/api/availability/month?year=${year}&month=${month}`);
            if (res.ok) setMonthAvailability(await res.json());
        };
        fetchMonthAvailability();
    }, [currentMonth]);

    useEffect(() => {
        if (!selectedDate || !serviceId) {
            setAvailableSlots([]);
            return;
        }
        setIsLoadingSlots(true);
        // Clear time selection if date changes
        // onTimeSelect(null); // This causes loop if not careful, handled by parent

        const fetchSlots = async () => {
            try {
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                const res = await fetch(`/api/availability?date=${dateStr}&serviceId=${serviceId}`);
                if (res.ok) {
                    const data = await res.json();
                    setAvailableSlots(data.slots || []);

                    // Auto-scroll to slots section
                    setTimeout(() => {
                        const slotsSection = document.getElementById('slots-section');
                        if (slotsSection) {
                            slotsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 100);
                }
            } finally {
                setIsLoadingSlots(false);
            }
        };
        fetchSlots();
    }, [selectedDate, serviceId]);

    const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-light tracking-tight text-neutral-900">Fecha y Hora</h2>
                <p className="text-neutral-400">Revisamos disponibilidad en tiempo real</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                {/* Calendar */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium capitalize text-neutral-900">{format(currentMonth, 'MMMM yyyy', { locale: es })}</h3>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="p-2 hover:bg-gray-50 rounded-full transition-colors text-neutral-600"><ChevronLeft size={20} /></button>
                            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-50 rounded-full transition-colors text-neutral-600"><ChevronRight size={20} /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-y-4 gap-x-1 mb-2">
                        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="text-center text-xs font-semibold text-neutral-400">{d}</div>)}
                    </div>

                    <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                        {Array.from({ length: (startOfMonth(currentMonth).getDay() + 6) % 7 }).map((_, i) => <div key={`pad-${i}`} />)}

                        {days.map(day => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const dayInfo = monthAvailability[dateStr];
                            const isDisabled = isBefore(day, startOfDay(new Date())) || (dayInfo ? !dayInfo.isOpen : false);
                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                            return (
                                <button
                                    key={day.toISOString()}
                                    onClick={() => !isDisabled && onDateSelect(day)}
                                    disabled={isDisabled}
                                    className={cn(
                                        "aspect-square w-full rounded-full flex items-center justify-center text-sm font-medium transition-all relative mx-auto max-w-[40px]",
                                        isSelected ? "bg-black text-white shadow-md scale-105 z-10" : isDisabled ? "text-gray-300 opacity-40 cursor-not-allowed" : "hover:bg-gray-100 text-neutral-700",
                                        isToday(day) && !isSelected && "ring-1 ring-gray-200 text-black font-bold"
                                    )}
                                >
                                    {format(day, 'd')}
                                    {isToday(day) && !isSelected && <div className="absolute -bottom-1 w-1 h-1 bg-black rounded-full" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Slots */}
                <div id="slots-section" className="flex flex-col space-y-4 scroll-mt-24">
                    <h3 className="font-medium text-lg text-neutral-900 px-2 flex items-center gap-2">
                        <Clock size={18} className="text-neutral-400" />
                        {selectedDate ? `Horarios para el ${format(selectedDate, "d/MM", { locale: es })}` : 'Selecciona un día'}
                    </h3>

                    <div className="flex-1 min-h-[300px] relative">
                        {!selectedDate ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-3 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                                <Calendar size={32} className="text-gray-300" />
                                <p className="text-sm font-medium">Elige una fecha primero</p>
                            </div>
                        ) : isLoadingSlots ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-100"><Loader2 className="animate-spin text-neutral-400" size={32} /></div>
                        ) : availableSlots.length === 0 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-3 border border-gray-100 rounded-2xl bg-white">
                                <p className="text-sm">Lo sentimos, no hay huecos.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3">
                                {availableSlots.map(time => (
                                    <button
                                        key={time}
                                        onClick={() => onTimeSelect(time)}
                                        className={cn(
                                            "py-3 px-2 rounded-xl border font-medium transition-all text-sm relative overflow-hidden active:scale-[0.98]",
                                            selectedTime === time
                                                ? "bg-black text-white border-black shadow-md"
                                                : "bg-white border-gray-200 hover:border-black/50 text-neutral-600 hover:text-black"
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
    );
}

function StepClientSelection({ currentClient, notes, onClientChange, onNotesChange }: {
    currentClient: ClientShort;
    notes: string;
    onClientChange: (c: ClientShort) => void;
    onNotesChange: (n: string) => void;
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState<ClientShort[]>([]);
    const [filteredClients, setFilteredClients] = useState<ClientShort[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showNewClientForm, setShowNewClientForm] = useState(false);

    // Fetch clients on mount (simpler than robust search API for now, fits user's current project scale)
    useEffect(() => {
        const loadClients = async () => {
            const res = await fetch('/api/bookings');
            if (res.ok) {
                const bookings: any[] = await res.json();
                const uniqueClients = new Map();
                bookings.forEach(b => {
                    if (b.customerEmail && b.status !== 'DELETED') {
                        uniqueClients.set(b.customerEmail, {
                            name: b.customerName,
                            email: b.customerEmail,
                            phone: b.customerPhone
                        });
                    }
                });
                setClients(Array.from(uniqueClients.values()));
            }
        };
        loadClients();
    }, []);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredClients([]);
            return;
        }
        const lower = searchTerm.toLowerCase();
        const results = clients.filter(c =>
            c.name.toLowerCase().includes(lower) ||
            c.email.toLowerCase().includes(lower) ||
            c.phone.includes(searchTerm)
        );
        setFilteredClients(results);
    }, [searchTerm, clients]);

    const handleSelectClient = (client: ClientShort) => {
        onClientChange(client);
        setSearchTerm('');
        setFilteredClients([]);
        // Ideally visual feedback that client is selected
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-light mb-2">Datos del Cliente</h2>
                <p className="text-gray-500 text-sm">Busca un cliente existente o crea uno nuevo</p>
            </div>

            {/* Selection / Form Toggle */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">

                {/* Search Box */}
                {!showNewClientForm && (
                    <div className="relative z-20">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Buscar Cliente</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); if (currentClient.name) onClientChange({ name: '', email: '', phone: '' }); }}
                                placeholder="Nombre, email o teléfono..."
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                            />
                        </div>

                        {/* Dropdown Results */}
                        {filteredClients.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto divide-y divide-gray-50">
                                {filteredClients.map(client => (
                                    <button
                                        key={client.email}
                                        onClick={() => handleSelectClient(client)}
                                        className="w-full text-left p-4 hover:bg-gray-50 flex items-center justify-between group"
                                    >
                                        <div>
                                            <p className="font-bold text-gray-900">{client.name}</p>
                                            <p className="text-xs text-gray-500">{client.email} • {client.phone}</p>
                                        </div>
                                        <Plus size={16} className="text-gray-300 group-hover:text-black" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {searchTerm && filteredClients.length === 0 && (
                            <div className="mt-4 text-center">
                                <p className="text-sm text-gray-500 mb-2">No se encontraron resultados.</p>
                                <button
                                    onClick={() => { setShowNewClientForm(true); setSearchTerm(''); }}
                                    className="text-sm font-bold text-black underline"
                                >
                                    Crear nuevo cliente
                                </button>
                            </div>
                        )}

                        {/* Always visible "Create New" option when not searching */}
                        {!searchTerm && (
                            <div className="mt-6 pt-6 border-t border-dashed border-gray-100 text-center">
                                <p className="text-sm text-gray-400 mb-3">¿Es un cliente nuevo?</p>
                                <button
                                    onClick={() => setShowNewClientForm(true)}
                                    className="px-6 py-2 bg-gray-50 hover:bg-black hover:text-white text-gray-900 rounded-full text-sm font-bold transition-all"
                                >
                                    + Crear Nuevo Cliente
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Selected or New Client Form */}
                {(currentClient.name || showNewClientForm) && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">
                                {showNewClientForm ? 'Nuevo Cliente' : 'Cliente Seleccionado'}
                            </h3>
                            {showNewClientForm && (
                                <button onClick={() => setShowNewClientForm(false)} className="text-xs text-gray-500 hover:text-black">
                                    Cancelar
                                </button>
                            )}
                            {!showNewClientForm && currentClient.name && (
                                <button onClick={() => onClientChange({ name: '', email: '', phone: '' })} className="text-xs text-red-500 hover:text-red-700">
                                    Cambiar
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
                                <input
                                    type="text"
                                    value={currentClient.name}
                                    onChange={e => onClientChange({ ...currentClient, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-black/5"
                                    placeholder="Nombre completo"
                                    readOnly={!showNewClientForm && !!currentClient.name && !showNewClientForm} // Readonly if selected from list? actually let them edit
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Teléfono *</label>
                                <input
                                    type="tel"
                                    value={currentClient.phone}
                                    onChange={e => onClientChange({ ...currentClient, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-black/5"
                                    placeholder="600 000 000"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">Email <span className="font-light opacity-60">(Opcional)</span></label>
                                <input
                                    type="email"
                                    value={currentClient.email}
                                    onChange={e => onClientChange({ ...currentClient, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-black/5"
                                    placeholder="cliente@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Notas Internas</label>
                            <textarea
                                value={notes}
                                onChange={e => onNotesChange(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-black/5 resize-none h-24"
                                placeholder="Detalles de la cita..."
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StepConfirmation({ service, date, time, client, notes }: { service: Service, date: Date, time: string, client: ClientShort, notes: string }) {
    return (
        <div className="max-w-md mx-auto py-8">
            <h2 className="text-2xl font-light text-center mb-8">Resumen Final</h2>

            <div className="bg-white rounded-3xl shadow-xl shadow-black/5 overflow-hidden border border-gray-100">
                {/* Header Ticket Style */}
                <div className="bg-black text-white p-6 text-center">
                    <p className="text-sm opacity-80 uppercase tracking-widest mb-1">Cita Manual</p>
                    <p className="text-3xl font-bold">{time}</p>
                    <p className="text-lg opacity-90">{format(date, "EEEE, d 'de' MMMM", { locale: es })}</p>
                </div>

                <div className="p-8 space-y-6">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Servicio</p>
                        <div className="flex justify-between items-start">
                            <span className="font-bold text-xl text-gray-900">{service.name}</span>
                            <span className="font-bold text-lg">{(service.price / 100).toFixed(0)}€</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{service.duration} minutos</p>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Cliente</p>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"><User size={14} /></div>
                            <span className="font-medium text-gray-900">{client.name}</span>
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"><Phone size={14} /></div>
                            <span className="text-gray-600">{client.phone}</span>
                        </div>
                        {client.email && (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"><Mail size={14} /></div>
                                <span className="text-gray-600 truncate">{client.email}</span>
                            </div>
                        )}
                    </div>

                    {notes && (
                        <div className="border-t border-gray-100 pt-6">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notas</p>
                            <p className="text-sm text-gray-600 italic">"{notes}"</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

