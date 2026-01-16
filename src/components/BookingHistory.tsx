'use client';

import { useState } from 'react';
import { ReservationCard } from './ReservationCard';
import { format } from 'date-fns';
import { History, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Booking {
    id: string;
    locator: string;
    date: string;
    time: string;
    serviceName: string;
    servicePrice: number;
    status: string;
    startAt: string;
}

interface Props {
    bookings: Booking[];
    userEmail: string;
}

export function BookingHistory({ bookings, userEmail }: Props) {
    const [isOpen, setIsOpen] = useState(false);

    if (bookings.length === 0) return null;

    return (
        <div className="pt-8 border-t border-dashed border-neutral-200">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-center gap-2 py-4 text-neutral-400 hover:text-neutral-600 transition-colors font-medium text-sm group"
            >
                <div className="p-2 bg-neutral-50 rounded-full group-hover:bg-neutral-100 transition-colors">
                    <History size={16} />
                </div>
                <span>{isOpen ? 'Ocultar citas anteriores' : `Ver historial de citas (${bookings.length})`}</span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 opacity-75 hover:opacity-100 transition-opacity duration-500">
                            {bookings.map((booking) => (
                                <ReservationCard
                                    key={booking.id}
                                    booking={booking}
                                    userEmail={userEmail}
                                    isPast={true}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
