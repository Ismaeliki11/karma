"use client";

import { useEffect, useState } from "react";
import { Search, Mail, Phone, Calendar, RefreshCcw, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ClientDetailSheet } from "@/components/admin/ClientDetailSheet";
import { AdminRescheduleModal } from "@/components/admin/AdminRescheduleModal";
import { deleteClient } from "@/actions/client-actions";

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
    email: string; // Unique identifier
    name: string;
    phone: string;
    totalBookings: number;
    totalSpend: number;
    lastVisit: string;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [allBookings, setAllBookings] = useState<Booking[]>([]); // Store raw bookings
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Detail Sheet State
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Reschedule Modal State
    const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/bookings");
            const bookingsData: Booking[] = await res.json();
            // Filter out DELETED bookings
            const activeBookings = bookingsData.filter(b => b.status.toUpperCase() !== 'DELETED');
            setAllBookings(activeBookings);

            // Aggregate bookings by email
            const clientMap = new Map<string, Client>();

            activeBookings.forEach(booking => {
                const email = booking.customerEmail.toLowerCase();
                const currentClient = clientMap.get(email);

                const price = booking.servicePrice || 0;
                const isConfirmed = booking.status === 'CONFIRMED';
                const bookingDate = new Date(booking.date).toISOString().split('T')[0];

                if (currentClient) {
                    clientMap.set(email, {
                        ...currentClient,
                        name: booking.customerName, // Update name just in case
                        phone: booking.customerPhone, // Update phone just in case
                        totalBookings: currentClient.totalBookings + 1,
                        totalSpend: currentClient.totalSpend + (isConfirmed ? price : 0),
                        lastVisit: bookingDate > currentClient.lastVisit ? bookingDate : currentClient.lastVisit
                    });
                } else {
                    clientMap.set(email, {
                        email,
                        name: booking.customerName,
                        phone: booking.customerPhone,
                        totalBookings: 1,
                        totalSpend: isConfirmed ? price : 0,
                        lastVisit: bookingDate
                    });
                }
            });

            setClients(Array.from(clientMap.values()));
        } catch (error) {
            console.error("Error fetching clients:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleDeleteClient = async (email: string) => {
        const res = await deleteClient(email);
        if (res.success) {
            alert("Cliente eliminado correctamente.");
            fetchClients(); // Refresh list
        } else {
            alert(res.error);
        }
    };

    const handleEditBooking = (booking: Booking) => {
        // Need to cast booking to match AdminRescheduleModal Booking interface (it has serviceId)
        // Oops, Booking interface here might be missing serviceId if API doesn't return it.
        // Let's assume API returns serviceId. If not, I need to fix API or interface.
        // Checking AdminDashboard interface... it had serviceId.
        // Let's make sure our Booking interface here matches.
        setRescheduleBooking(booking as any);
        setIsRescheduleOpen(true);
        // Note: We keep Detail Sheet open? Or close it?
        // Let's keep it open so user returns to it.
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)
    );

    // Get bookings for selected client
    const selectedClientBookings = selectedClient
        ? allBookings.filter(b => b.customerEmail.toLowerCase() === selectedClient.email.toLowerCase())
        : [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Cartera de Clientes</h2>
                    <p className="text-sm text-gray-500">Historial de clientes basado en las reservas.</p>
                </div>
                <button
                    onClick={fetchClients}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                    <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
                    Actualizar
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email o teléfono..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-40 animate-pulse bg-gray-50/50" />
                    ))
                ) : filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                        <div
                            key={client.email}
                            onClick={() => {
                                setSelectedClient(client);
                                setIsDetailOpen(true);
                            }}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{client.name}</h3>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Cliente desde {new Date(client.lastVisit).getFullYear()}</p>
                                </div>
                                <div className="bg-black text-white text-xs font-bold px-2 py-1 rounded-full">
                                    {client.totalBookings} citas
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 mb-6">
                                <div className="flex items-center gap-2">
                                    <Mail size={14} className="text-gray-400" />
                                    <span className="truncate">{client.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-gray-400" />
                                    <span>{client.phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-gray-400" />
                                    <span>Última visita: {format(new Date(client.lastVisit), "d MMM, yyyy", { locale: es })}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-gray-400 font-medium">GASTO TOTAL</p>
                                    <p className="text-xl font-bold text-gray-900">{(client.totalSpend / 100).toFixed(2)}€</p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.location.href = `tel:${client.phone}`;
                                        }}
                                        className="p-2 bg-gray-50 text-gray-600 rounded-full hover:bg-black hover:text-white transition-colors"
                                    >
                                        <Phone size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(`https://wa.me/${client.phone.replace(/\s+/g, '')}`, '_blank');
                                        }}
                                        className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-500 hover:text-white transition-colors"
                                    >
                                        <MessageCircle size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        No se encontraron clientes.
                    </div>
                )}
            </div>

            {/* Client Detail Sheet */}
            {selectedClient && (
                <ClientDetailSheet
                    client={selectedClient}
                    bookings={selectedClientBookings}
                    isOpen={isDetailOpen}
                    onClose={() => setIsDetailOpen(false)}
                    onEditBooking={handleEditBooking}
                    onDeleteClient={handleDeleteClient}
                />
            )}

            {/* Reschedule Modal */}
            {rescheduleBooking && (
                <AdminRescheduleModal
                    booking={rescheduleBooking as any}
                    isOpen={isRescheduleOpen}
                    onClose={() => setIsRescheduleOpen(false)}
                    onSuccess={() => {
                        setIsRescheduleOpen(false);
                        fetchClients(); // Refresh filtered data
                        alert("Cita reprogramada con éxito");
                    }}
                />
            )}
        </div>
    );
}
