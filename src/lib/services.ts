export const CATEGORIES = [
    {
        title: "Manicura y Manos",
        services: [
            {
                id: 'manicura-tradicional',
                name: 'Manicura Tradicional',
                description: 'Limpieza, limado y esmaltado normal.',
                price: 1500,
                duration: 45,
                image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=400',
            },
            {
                id: 'manicura-rusa',
                name: 'Manicura Rusa',
                description: 'Limpieza profunda de cutículas con torno.',
                price: 2500,
                duration: 60,
                image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?auto=format&fit=crop&q=80&w=400',
            },
            {
                id: 'soft-gel',
                name: 'Soft Gel (Kapping)',
                description: 'Nivelación y refuerzo sobre tu uña natural.',
                price: 3000,
                duration: 75,
                image: 'https://images.unsplash.com/photo-1632345031635-c38d011f0612?auto=format&fit=crop&q=80&w=400',
            },
        ]
    },
    {
        title: "Pedicura y Pies",
        services: [
            {
                id: 'pedicura-spa',
                name: 'Pedicura Spa',
                description: 'Baño de sales, exfoliación y esmaltado.',
                price: 3500,
                duration: 60,
                image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?auto=format&fit=crop&q=80&w=400',
            },
            {
                id: 'pedicura-completa',
                name: 'Pedicura Completa',
                description: 'Tratamiento de durezas y cuidado integral.',
                price: 4000,
                duration: 75,
                image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=400',
            }
        ]
    }
];

export function getServiceById(id: string) {
    for (const cat of CATEGORIES) {
        const found = cat.services.find(s => s.id === id);
        if (found) return found;
    }
    return null;
}
