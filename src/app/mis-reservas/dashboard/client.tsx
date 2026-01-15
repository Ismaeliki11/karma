'use client';

import { useState } from 'react';
import { ReservationCard } from '@/components/ReservationCard';
import { BookingHistory } from '@/components/BookingHistory';
import { Calendar, ArrowRight, ArrowUpDown, Clock } from 'lucide-react';
import Link from 'next/link';

interface Booking {
    id: string;
    locator: string;
    date: string;
    time: string;
    serviceName: string;
    servicePrice: number;
    serviceDuration: number;
    status: string;
    startAt: Date;
    createdAt: Date;
}

interface Props {
    bookings: Booking[];
    userEmail: string;
}

export function DashboardClient({ bookings, userEmail }: Props) {
    const [sortBy, setSortBy] = useState<'date' | 'created' | 'price'>('date');

    // Logic to split and sort
    const now = new Date();

    // Separate into upcoming and past
    const upcoming = bookings.filter(b => new Date(b.startAt) >= now);
    const past = bookings.filter(b => new Date(b.startAt) < now);

    // Sort upcoming based on selection
    const sortedUpcoming = [...upcoming].sort((a, b) => {
        if (sortBy === 'date') {
            // Chronological: Soonest startAt first
            return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
        } else if (sortBy === 'created') {
            // Creation: Newest created first (most recent booking action)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else {
            // Price: Higher price first (descending)
            return b.servicePrice - a.servicePrice;
        }
    });

    // Past is usually best chronological descending (History)
    const sortedPast = [...past].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-light tracking-wide text-neutral-900">Tus Reservas</h2>
                    <span className="text-xs font-medium text-neutral-400 bg-white px-3 py-1 rounded-full border border-neutral-100 shadow-sm">
                        {sortedUpcoming.length} Activas
                    </span>
                </div>

                {/* Centered & Responsive Sort Control */}
                {sortedUpcoming.length > 0 && (
                    <div className="flex justify-center w-full">
                        <div className="inline-flex items-center bg-white rounded-full p-1 border border-neutral-100 shadow-sm w-full sm:w-auto max-w-md">
                            <button
                                onClick={() => setSortBy('date')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${sortBy === 'date'
                                    ? 'bg-neutral-100 text-neutral-900 shadow-sm'
                                    : 'text-neutral-400 hover:text-neutral-600'
                                    }`}
                            >
                                <Calendar size={14} />
                                <span className="hidden sm:inline">Cronológico</span>
                                <span className="sm:hidden">Fecha</span>
                            </button>
                            <button
                                onClick={() => setSortBy('created')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${sortBy === 'created'
                                    ? 'bg-neutral-100 text-neutral-900 shadow-sm'
                                    : 'text-neutral-400 hover:text-neutral-600'
                                    }`}
                            >
                                <Clock size={14} />
                                Recientes
                            </button>
                            <button
                                onClick={() => setSortBy('price')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${sortBy === 'price'
                                    ? 'bg-neutral-100 text-neutral-900 shadow-sm'
                                    : 'text-neutral-400 hover:text-neutral-600'
                                    }`}
                            >
                                <ArrowUpDown size={14} />
                                Precio
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {sortedUpcoming.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2rem] border border-neutral-100 shadow-[0_2px_40px_-12px_rgba(0,0,0,0.05)] text-center px-4">
                    <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-6 group transition-all hover:scale-105 duration-500">
                        <Calendar className="text-neutral-300 group-hover:text-neutral-900 transition-colors" size={32} />
                    </div>
                    <p className="text-xl font-medium text-neutral-900">No tienes citas próximas</p>
                    <p className="text-neutral-400 text-sm mt-2 mb-8 max-w-xs mx-auto leading-relaxed">
                        ¿Te apetece un momento de relax? Reserva tu próxima cita en unos segundos.
                    </p>
                    <Link
                        href="/reserva/servicios"
                        className="bg-black text-white px-8 py-4 rounded-2xl text-sm font-medium hover:bg-neutral-800 transition-all hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        Reservar Cita
                        <ArrowRight size={16} />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sortedUpcoming.map((booking) => (
                        <ReservationCard
                            key={booking.id}
                            booking={booking as any}
                            userEmail={userEmail}
                        />
                    ))}
                </div>
            )}

            {/* History Section */}
            <BookingHistory
                bookings={sortedPast}
                userEmail={userEmail}
            />
        </div>
    );
}
