
"use client";

import { useState, useEffect } from 'react';

export type Service = {
    id: string;
    name: string;
    description: string | null;
    type: string;
    price: number;
    duration: number;
    imageUrl: string | null;
};

export type Category = {
    title: string;
    services: Service[];
};

export const SERVICE_TYPES_MAP: Record<string, string> = {
    'manicure': 'Manicura y Manos',
    'pedicure': 'Pedicura y Pies',
    'facial': 'Tratamientos Faciales',
    'body': 'Tratamientos Corporales',
    'other': 'Otros Servicios'
};

export function useServices() {
    const [services, setServices] = useState<Service[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await fetch('/api/services');
                if (!res.ok) throw new Error('Failed to fetch services');
                const data: Service[] = await res.json();

                setServices(data);

                // Group by type
                const grouped = data.reduce((acc, service) => {
                    let type = service.type || 'other';
                    // Force unknown types to 'other' so we don't get multiple groups mapping to "Otros Servicios"
                    if (!SERVICE_TYPES_MAP[type]) {
                        type = 'other';
                    }

                    if (!acc[type]) {
                        acc[type] = [];
                    }
                    acc[type].push(service);
                    return acc;
                }, {} as Record<string, Service[]>);

                const cats: Category[] = Object.keys(grouped).map(type => ({
                    title: SERVICE_TYPES_MAP[type] || 'Otros Servicios',
                    services: grouped[type]
                }));

                // Sort categories to match preferred order if needed
                const order = ['manicure', 'pedicure', 'facial', 'body', 'other'];
                cats.sort((a, b) => {
                    const indexA = order.findIndex(o => SERVICE_TYPES_MAP[o] === a.title);
                    const indexB = order.findIndex(o => SERVICE_TYPES_MAP[o] === b.title);
                    return indexA - indexB;
                });

                setCategories(cats);
            } catch (err) {
                console.error(err);
                setError('Error loading services');
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
    }, []);

    const getServiceById = (id: string) => services.find(s => s.id === id);

    return { services, categories, loading, error, getServiceById };
}
