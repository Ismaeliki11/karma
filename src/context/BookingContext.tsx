
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type BookingState = {
    serviceId: string | null;
    serviceName: string | null;
    servicePrice: number | null; // stored in cents
    serviceDuration: number | null; // in minutes
    serviceImage: string | null;
    selectedOptions: string[]; // IDs of selected add-ons
    date: Date | null;
    time: string | null; // HH:MM
    customer: {
        name: string;
        email: string;
        phone: string;
        notes: string;
    };
};

type BookingContextType = {
    booking: BookingState;
    setBooking: (booking: BookingState) => void;
    updateBooking: (updates: Partial<BookingState>) => void;
    resetBooking: () => void;
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
    const [booking, setBooking] = useState<BookingState>({
        serviceId: null,
        serviceName: null,
        servicePrice: null,
        serviceDuration: null,
        serviceImage: null,
        selectedOptions: [],
        date: null,
        time: null,
        customer: { name: '', email: '', phone: '', notes: '' },
    });

    const updateBooking = (updates: Partial<BookingState>) => {
        setBooking((prev) => ({ ...prev, ...updates }));
    };

    const resetBooking = () => {
        setBooking({
            serviceId: null,
            serviceName: null,
            servicePrice: null,
            serviceDuration: null,
            serviceImage: null,
            selectedOptions: [],
            date: null,
            time: null,
            customer: { name: '', email: '', phone: '', notes: '' },
        });
    };

    return (
        <BookingContext.Provider value={{ booking, setBooking, updateBooking, resetBooking }}>
            {children}
        </BookingContext.Provider>
    );
}

export function useBooking() {
    const context = useContext(BookingContext);
    if (!context) {
        throw new Error('useBooking must be used within a BookingProvider');
    }
    return context;
}
