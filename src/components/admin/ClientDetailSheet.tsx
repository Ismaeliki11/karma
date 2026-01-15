"use client";

import { X, Phone, Mail, Calendar, Trash2, Edit2, History, ChevronRight, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Booking {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    date: string;
    startTime: string;
    status: string;
    servicePrice: number;
    serviceName: string;
}

interface Client {
    email: string;
    name: string;
    phone: string;
}

interface ClientDetailSheetProps {
    client: Client;
    bookings: Booking[];
    isOpen: boolean;
    onClose: () => void;
    onEditBooking: (booking: Booking) => void;
    onDeleteClient: (email: string) => void;
}

export function ClientDetailSheet({ client, bookings, isOpen, onClose, onEditBooking, onDeleteClient }: ClientDetailSheetProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen) return null;

    // Sort bookings: Future first (ascending), then Past (descending)
    const now = new Date();
    const futureBookings = bookings
        .filter(b => new Date(b.date + 'T' + b.startTime) >= now)
        .sort((a, b) => new Date(a.date + 'T' + a.startTime).getTime() - new Date(b.date + 'T' + b.startTime).getTime());

    const pastBookings = bookings
        .filter(b => new Date(b.date + 'T' + b.startTime) < now)
        .sort((a, b) => new Date(b.date + 'T' + b.startTime).getTime() - new Date(a.date + 'T' + a.startTime).getTime());

    const handleDelete = async () => {
        if (confirm("¿Estás seguro de que quieres eliminar este cliente y TODAS sus reservas? Esta acción no se puede deshacer.")) {
            setIsDeleting(true);
            await onDeleteClient(client.email);
            setIsDeleting(false);
            onClose();
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

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "CONFIRMED": return "bg-green-100 text-green-700";
            case "CANCELLED": return "bg-red-50 text-red-500 opacity-75";
            case "PENDING": return "bg-yellow-50 text-yellow-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Sheet Content */}
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
                    <h2 className="font-bold text-lg">Detalle Cliente</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Profile Header */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                            {client.name.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{client.name}</h3>
                        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mt-1">
                            <Mail size={14} /> {client.email}
                        </div>
                        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mt-1">
                            <Phone size={14} /> {client.phone}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-50 p-4 rounded-xl text-center">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Reservas</p>
                            <p className="text-2xl font-black text-gray-900">{bookings.length}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl text-center">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Histórico</p>
                            <p className="text-2xl font-black text-gray-900">
                                {(bookings.filter(b => b.status === 'CONFIRMED').reduce((acc, curr) => acc + curr.servicePrice, 0) / 100).toFixed(0)}€
                            </p>
                        </div>
                    </div>

                    {/* Future Bookings */}
                    <div className="mb-8">
                        <h4 className="font-bold flex items-center gap-2 mb-4">
                            <Calendar size={18} /> Próximas Citas
                        </h4>
                        {futureBookings.length > 0 ? (
                            <div className="space-y-3">
                                {futureBookings.map(booking => (
                                    <div key={booking.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-bold text-lg">
                                                    {format(new Date(booking.date), "d MMM", { locale: es })} · {booking.startTime}
                                                </p>
                                                <p className="text-sm text-gray-600">{booking.serviceName}</p>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded border ${getStatusStyle(booking.status)}`}>
                                                {getStatusLabel(booking.status)}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onEditBooking(booking)}
                                                className="h-8 text-xs gap-1"
                                            >
                                                <Edit2 size={12} /> Modificar
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 italic text-center py-4 bg-gray-50 rounded-xl">No hay citas próximas</p>
                        )}
                    </div>

                    {/* Past Bookings */}
                    <div>
                        <h4 className="font-bold flex items-center gap-2 mb-4 text-gray-500">
                            <History size={18} /> Historial
                        </h4>
                        {pastBookings.length > 0 ? (
                            <div className="space-y-3">
                                {pastBookings.map(booking => (
                                    <div key={booking.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex justify-between items-center opacity-80">
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {format(new Date(booking.date), "d MMM yyyy", { locale: es })}
                                            </p>
                                            <p className="text-xs text-gray-500">{booking.serviceName}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${getStatusStyle(booking.status)}`}>
                                            {getStatusLabel(booking.status)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 italic text-center py-4">Sin historial previo</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0">
                    <Button
                        onClick={handleDelete}
                        className="w-full bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 shadow-none border-0 py-6"
                        disabled={isDeleting}
                    >
                        <Trash2 size={18} className="mr-2" />
                        {isDeleting ? "Eliminando..." : "Eliminar Cliente"}
                    </Button>
                    <p className="text-[10px] text-gray-400 text-center mt-2">
                        Esto eliminará permanentemente al cliente y todas sus reservas.
                    </p>
                </div>
            </div>
        </div>
    );
}
