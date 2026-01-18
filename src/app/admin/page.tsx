"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import {
    CheckCircle2,
    XCircle,
    Clock,
    RefreshCcw,
    Search,
    Phone,
    MessageCircle, // WhatsApp similar icon
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    X,
    Filter,
    History,
    ChevronDown,
    Edit2,
    Check
} from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";

interface Booking {
    id: string;
    locator: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    date: string;
    startTime: string;
    startAt: string; // ISO String from API
    endAt: string; // ISO String from API
    status: string;
    createdAt: string;
    serviceName: string;
    serviceId: string;
    servicePrice: number;
}

import Link from "next/link";
import { AdminRescheduleModal } from "@/components/admin/AdminRescheduleModal";

import { useSearchParams } from "next/navigation";

import { Suspense } from 'react';

function AdminDashboardContent() {
    const searchParams = useSearchParams();
    const initialDate = searchParams.get("date") || new Date().toISOString().split('T')[0];

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [originalBookings, setOriginalBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Default to today for better UX
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const dateInputRef = useRef<HTMLInputElement>(null);

    // Edit Panel State
    const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [modalStartAtService, setModalStartAtService] = useState(false);
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [editForm, setEditForm] = useState<Partial<Booking>>({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/bookings");
            const data = await res.json();
            // Filter out DELETED bookings as per user request (case insensitive)
            const activeBookings = data.filter((b: Booking) => b.status.toUpperCase() !== 'DELETED');
            setBookings(activeBookings);
            setOriginalBookings(activeBookings);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter Logic
    useEffect(() => {
        let result = [...originalBookings];

        // 1. Date Filter (Always active - "One Day view" is standard for salons)
        if (selectedDate) {
            result = result.filter(b => b.date === selectedDate);
        }

        // 2. Search
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(b =>
                b.customerName.toLowerCase().includes(lowerTerm) ||
                b.locator.toLowerCase().includes(lowerTerm) ||
                b.customerEmail.toLowerCase().includes(lowerTerm)
            );
        }

        // 3. Sort by Time (Ascending) default for daily view
        result.sort((a, b) => {
            return a.startTime.localeCompare(b.startTime);
        });

        setBookings(result);
    }, [searchTerm, selectedDate, originalBookings]);

    const changeDate = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    // --- EDITING LOGIC ---
    const openEditPanel = (booking: Booking) => {
        setEditingBooking(booking);
        setEditForm({ ...booking });
        setIsEditPanelOpen(true);
    };

    const handleEditChange = (field: keyof Booking, value: string) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const saveEdit = async () => {
        if (!editingBooking || !editForm.id) return;

        try {
            const res = await fetch("/api/bookings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });

            if (res.ok) {
                setOriginalBookings(prev => prev.map(b => b.id === editForm.id ? { ...b, ...editForm } as Booking : b));
                setIsEditPanelOpen(false);
                setEditingBooking(null);
            } else {
                alert("Error al guardar la reserva");
            }
        } catch (error) {
            alert("Error de conexión");
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "CONFIRMED": return "bg-green-100 text-green-700 border-green-200";
            case "CANCELLED": return "bg-red-50 text-red-500 border-red-100 opacity-75";
            case "PENDING": return "bg-yellow-50 text-yellow-700 border-yellow-200";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "CONFIRMED": return "Confirmada";
            case "CANCELLED": return "Cancelada";
            case "PENDING": return "Pendiente";
            default: return status;
        }
    };

    return (
        <div className="space-y-4 max-w-xl mx-auto md:max-w-none">
            {/* --- HEADER & DATE PICKER --- */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 sticky top-0 z-10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold tracking-tight">Citas</h2>
                    <div className="flex gap-2">
                        <Link
                            href="/admin/nueva-reserva"
                            className="bg-black text-white px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-neutral-800 transition-colors flex items-center gap-2"
                        >
                            <CalendarIcon size={16} />
                            <span>Nueva</span>
                        </Link>
                        <button onClick={fetchData} className="p-2 bg-gray-50 rounded-full text-gray-600 hover:bg-black hover:text-white transition-colors">
                            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                {/* Date Navigation */}
                <div className="flex items-center justify-between gap-4 bg-gray-50 p-1.5 rounded-xl">
                    <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm">
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex-1 flex justify-center">
                        <div
                            onClick={() => dateInputRef.current?.showPicker()}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white transition-colors cursor-pointer group select-none"
                        >
                            <CalendarIcon size={16} className="text-gray-500 group-hover:text-black transition-colors" />
                            <span className="text-sm font-bold text-gray-900 capitalize group-hover:underline decoration-dashed underline-offset-4">
                                {format(new Date(selectedDate), "EEEE, d MMM", { locale: es })}
                            </span>
                        </div>
                        {/* Hidden Input controlled via ref */}
                        <input
                            ref={dateInputRef}
                            type="date"
                            className="absolute opacity-0 pointer-events-none w-0 h-0"
                            value={selectedDate}
                            onChange={(e) => {
                                if (e.target.value) setSelectedDate(e.target.value);
                            }}
                        />
                    </div>

                    <button onClick={() => changeDate(1)} className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Search Bar - Collapsible or small */}
                {searchTerm && (
                    <div className="mt-3 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {/* --- BOOKINGS LIST --- */}
            <div className="space-y-3 pb-20"> {/* pb-20 for bottom nav space */}
                {/* Quick Search Toggle if empty */}
                {!searchTerm && (
                    <div className="flex justify-end">
                        <button onClick={() => setSearchTerm(" ")} className="text-xs text-gray-500 flex items-center gap-1">
                            <Search size={12} /> Buscar
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12 text-gray-400">Cargando citas...</div>
                ) : (
                    <>
                        {(() => {
                            const now = new Date();
                            const pastBookings = bookings.filter(b => b.endAt && new Date(b.endAt) < now);
                            const upcomingBookings = bookings.filter(b => !b.endAt || new Date(b.endAt) >= now);

                            return (
                                <>
                                    {/* Pasadas (Collapsible) */}
                                    {pastBookings.length > 0 && (
                                        <details className="group bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden mb-4">
                                            <summary className="flex items-center justify-between p-4 cursor-pointer list-none select-none hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <History size={16} />
                                                    <span className="text-sm font-medium">Pasadas ({pastBookings.length})</span>
                                                </div>
                                                <ChevronDown size={16} className="text-gray-400 transition-transform group-open:rotate-180" />
                                            </summary>
                                            <div className="p-4 pt-0 space-y-3 border-t border-gray-100/50">
                                                {pastBookings.map(booking => (
                                                    <div
                                                        key={booking.id}
                                                        onClick={() => openEditPanel(booking)}
                                                        className={`bg-white/60 rounded-xl p-3 border border-gray-100 relative overflow-hidden active:scale-[0.99] transition-transform cursor-pointer opacity-70 grayscale-[0.3] hover:opacity-100 hover:grayscale-0`}
                                                    >
                                                        {/* Status Stripe */}
                                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusStyle(booking.status).split(' ')[0]}`} />

                                                        <div className="pl-3 flex justify-between items-center">
                                                            <div>
                                                                <span className="text-sm font-bold text-gray-900 line-through decoration-gray-400">
                                                                    {booking.startTime}
                                                                </span>
                                                                <p className="text-sm font-medium text-gray-700">{booking.customerName}</p>
                                                            </div>
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide border ${getStatusStyle(booking.status)}`}>
                                                                {getStatusLabel(booking.status)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    )}

                                    {/* Upcoming / Active */}
                                    {upcomingBookings.length > 0 ? (
                                        upcomingBookings.map((booking) => (
                                            <div
                                                key={booking.id}
                                                onClick={() => openEditPanel(booking)}
                                                className={`bg-white rounded-2xl p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden active:scale-[0.99] transition-transform cursor-pointer ${booking.status === 'CANCELLED' ? 'grayscale opacity-75' : ''}`}
                                            >
                                                {/* Status Stripe */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getStatusStyle(booking.status).split(' ')[0]}`} />

                                                <div className="pl-3 flex justify-between items-start">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                                                            <h3 className="text-xl font-bold text-gray-900 tracking-tight whitespace-nowrap">
                                                                {booking.startTime} - {booking.endAt ? format(new Date(booking.endAt), 'HH:mm') : '??:??'}
                                                            </h3>
                                                            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
                                                                ({booking.endAt && booking.startAt ? Math.round((new Date(booking.endAt).getTime() - new Date(booking.startAt).getTime()) / 60000) : '?'} min)
                                                            </span>
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide border whitespace-nowrap ${getStatusStyle(booking.status)}`}>
                                                                {getStatusLabel(booking.status)}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-semibold text-gray-900 leading-tight">{booking.customerName}</h4>
                                                        <p className="text-sm text-gray-500 mt-0.5">{booking.serviceName}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-gray-900">{(booking.servicePrice / 100).toFixed(2)}€</p>
                                                        <div className="flex gap-2 mt-3 justify-end">
                                                            {/* Action Buttons (Stop propagation to prevent opening modal if clicked directly) */}
                                                            <a
                                                                href={`tel:${booking.customerPhone}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="p-2 bg-gray-50 text-gray-600 rounded-full hover:bg-black hover:text-white transition-colors"
                                                            >
                                                                <Phone size={16} />
                                                            </a>
                                                            <a
                                                                href={`https://wa.me/${booking.customerPhone.replace(/\s+/g, '')}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-500 hover:text-white transition-colors"
                                                            >
                                                                <MessageCircle size={16} />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        bookings.length === 0 && ( /* Only show empty state if NO bookings at all (neither past nor upcoming) */
                                            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
                                                <CalendarIcon size={48} className="mb-4 text-gray-200" />
                                                <p>No hay citas para este día.</p>
                                            </div>
                                        )
                                    )}
                                    {/* If we have past bookings but no upcoming, we might want to show a message or just nothing. The above logic handles empty state only if total array is empty. 
                                        If we have past bookings but no upcoming, it will just show past bookings. That's fine. 
                                    */}
                                    {pastBookings.length > 0 && upcomingBookings.length === 0 && (
                                        <div className="text-center py-12 text-gray-300 italic text-sm">
                                            No hay más citas próximas para hoy.
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </>
                )}
            </div>

            {/* --- MOBILE FULL SCREEN EDIT MODAL --- */}
            {isEditPanelOpen && editingBooking && (
                <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom duration-300 sm:max-w-md sm:ml-auto sm:shadow-2xl sm:border-l">
                    {/* Modal Headers */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                        <button
                            onClick={() => setIsEditPanelOpen(false)}
                            className="p-2 -ml-2 text-gray-500 hover:text-black rounded-full"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <h3 className="font-bold text-lg text-center flex-1">Editar Reserva</h3>
                        <div className="w-8" /> {/* Spacer for centering */}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* REMOVED STATUS TOGGLES AS REQUESTED */}

                        {/* Date & Time */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                            <p className="text-sm text-gray-500 mb-1">Cita programada para</p>
                            <h4 className="text-xl font-bold text-gray-900 capitalize">
                                {editForm.date ? format(new Date(editForm.date), "EEEE d 'de' MMMM", { locale: es }) : '...'}
                            </h4>
                            <p className="text-2xl font-black text-black mt-1">{editForm.startTime}</p>

                            <Button
                                onClick={() => {
                                    setModalStartAtService(false);
                                    setIsRescheduleModalOpen(true);
                                }}
                                variant="outline"
                                className="mt-4 w-full bg-white border-gray-200 hover:bg-black hover:text-white transition-all gap-2"
                            >
                                <CalendarIcon size={16} />
                                Cambiar fecha y hora
                            </Button>
                        </div>

                        {/* Customer Details */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cliente</label>
                                <input
                                    type="text"
                                    value={editForm.customerName}
                                    onChange={(e) => handleEditChange('customerName', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-black/5 font-medium"
                                    placeholder="Nombre"
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <input
                                    type="tel"
                                    value={editForm.customerPhone}
                                    onChange={(e) => handleEditChange('customerPhone', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-black/5 font-mono text-sm"
                                    placeholder="Teléfono"
                                />
                                <input
                                    type="email"
                                    value={editForm.customerEmail}
                                    onChange={(e) => handleEditChange('customerEmail', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-black/5 text-sm"
                                    placeholder="Email"
                                />
                            </div>
                        </div>

                        {/* Service Details */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Servicio</label>
                            <div
                                onClick={() => {
                                    setModalStartAtService(true);
                                    setIsRescheduleModalOpen(true);
                                }}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-white hover:border-black hover:shadow-md transition-all group active:scale-[0.99]"
                            >
                                <span className="font-bold text-gray-900 group-hover:text-black transition-colors">{editForm.serviceName}</span>
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-400 group-hover:text-black transition-colors bg-white px-2 py-1 rounded-md border border-gray-100 group-hover:border-gray-200">
                                    <Edit2 size={14} />
                                    <span>Cambiar</span>
                                </div>
                            </div>
                        </div>

                        {/* Status Actions */}
                        <div className="pt-2">
                            {editForm.status === 'CANCELLED' ? (
                                <button
                                    onClick={() => {
                                        setEditForm(prev => ({ ...prev, status: 'CONFIRMED' }));
                                    }}
                                    className="w-full py-3 text-sm font-bold text-green-600 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                                >
                                    Reactivar Cita
                                </button>
                            ) : (
                                <button
                                    onClick={() => setEditForm(prev => ({ ...prev, status: 'CANCELLED' }))}
                                    className="w-full py-3 text-sm font-bold text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                                >
                                    Cancelar Cita
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="p-6 border-t border-gray-100 bg-white space-y-3">
                        <Button
                            onClick={saveEdit}
                            className="w-full h-12 text-base font-bold bg-black text-white rounded-xl shadow-lg shadow-black/20 active:scale-[0.98] transition-transform"
                        >
                            Guardar Cambios
                        </Button>

                        <button
                            onClick={() => setIsEditPanelOpen(false)}
                            className="w-full py-2 text-sm font-medium text-gray-400 hover:text-gray-600"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
            {isRescheduleModalOpen && editingBooking && (
                <AdminRescheduleModal
                    booking={editingBooking}
                    isOpen={isRescheduleModalOpen}
                    startAtService={modalStartAtService}
                    onClose={() => setIsRescheduleModalOpen(false)}
                    onSuccess={() => {
                        setIsRescheduleModalOpen(false);
                        setIsEditPanelOpen(false);
                        fetchData(); // Refresh data
                        alert("Cita reprogramada con éxito");
                    }}
                />
            )}

        </div>
    );
}

export default function AdminDashboard() {
    return (
        <Suspense fallback={<div className="p-4 text-center">Cargando panel...</div>}>
            <AdminDashboardContent />
        </Suspense>
    );
}
