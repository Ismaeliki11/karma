
import { db } from './index';
import { services } from './schema';
import { sql } from 'drizzle-orm';

const CATEGORIES = [
    {
        title: "Uñas (Manos)",
        services: [
            {
                id: 'manicura-rusa',
                name: 'Manicura Rusa (Sin esmaltar)',
                description: 'Limpieza profunda de cutículas con torno, nivelación y acabado natural sin esmaltado.',
                price: 1750,
                duration: 30,
                image: '/services/manicura_rusa.png',
                type: 'manicure'
            },
            {
                id: 'manicura-rusa-semi',
                name: 'Manicura Rusa + Semipermanente',
                description: 'Limpieza rusa completa combinada con esmaltado semipermanente de alta durabilidad.',
                price: 2750,
                duration: 60,
                image: '/services/manicura_semipermanente.png',
                type: 'manicure'
            },
            {
                id: 'esmaltado-semi-liso',
                name: 'Esmaltado Semipermanente Liso',
                description: 'Aplicación de color liso semipermanente con preparación básica.',
                price: 2000,
                duration: 45,
                image: '/services/manicura_semipermanente.png',
                type: 'manicure'
            },
            {
                id: 'retirado-semi',
                name: 'Retirado de Semipermanente',
                description: 'Eliminación cuidadosa del esmalte semipermanente para proteger la uña natural.',
                price: 650,
                duration: 15,
                image: '/services/retirada_unas.png',
                type: 'manicure'
            },
            {
                id: 'retirado-gel',
                name: 'Retirado de Gel / Acrygel',
                description: 'Retirada profesional de material de construcción (gel o acrygel).',
                price: 1250,
                duration: 30,
                image: '/services/retirada_unas.png',
                type: 'manicure'
            },
            {
                id: 'relleno-gel',
                name: 'Relleno de Gel / Acrygel',
                description: 'Mantenimiento y relleno del crecimiento para uñas de gel o acrygel.',
                price: 3500,
                duration: 90,
                image: '/services/unas_gel_acrygel.png',
                type: 'manicure'
            },
            {
                id: 'puesta-nueva-gel',
                name: 'Puesta nueva Gel / Acrygel',
                description: 'Esculpido de uñas nuevas completas con extensão en gel o acrygel.',
                price: 5000,
                duration: 120,
                image: '/services/unas_gel_acrygel.png',
                type: 'manicure'
            },
        ]
    },
    {
        title: "Uñas (Pies)",
        services: [
            {
                id: 'pedicura-spa',
                name: 'Pedicura SPA Completa',
                description: 'Experiencia relajante con limpieza, exfoliación, hidratación profunda y esmaltado.',
                price: 3750,
                duration: 60,
                image: '/services/pedicura_spa.png',
                type: 'pedicure'
            },
            {
                id: 'cortar-unas-pies',
                name: 'Cortar uñas de pies',
                description: 'Servicio higiénico de corte y limado de uñas de los pies.',
                price: 1000,
                duration: 15,
                image: '/services/pedicura_esmalte.png',
                type: 'pedicure'
            },
            {
                id: 'pedicura-express',
                name: 'Pedicura Express (Esmaltar)',
                description: 'Arreglo rápido de uñas y esmaltado de pies.',
                price: 2000,
                duration: 30,
                image: '/services/pedicura_esmalte.png',
                type: 'pedicure'
            },
        ]
    },
    {
        title: "Facial Avanzado",
        services: [
            {
                id: 'hydrafacial',
                name: 'Limpieza Facial Hydrafacial',
                description: 'Tecnología patentada para limpiar, extraer e hidratar la piel profundamente.',
                price: 6000,
                duration: 60,
                image: '/services/hydrafacial.png',
                type: 'facial'
            },
            {
                id: 'hydradermie-lift',
                name: 'Tratamiento Hydradermie Lift',
                description: 'Tratamiento de "lifting" inmediato mediante estimulación muscular facial.',
                price: 8000,
                duration: 60,
                image: '/services/hydradermie.png',
                type: 'facial'
            },
            {
                id: 'dermapen',
                name: 'Dermapen (Glow Up Skin)',
                description: 'Dispositivo de micro-agujas que estimula el colágeno y rejuvenece la piel.',
                price: 13900,
                duration: 60,
                image: '/services/dermapen.png',
                type: 'facial'
            },
            {
                id: 'mascara-led',
                name: 'Máscara LED (Cara y Cuello)',
                description: 'Fototerapia LED para tratar diversas afecciones de la piel y rejuvenecer.',
                price: 5000,
                duration: 30,
                image: '/services/mascara_led.png',
                type: 'facial'
            },
            {
                id: 'mascarilla-casmara',
                name: 'Mascarilla Peel-off Casmara',
                description: 'Mascarilla de algas premium con efecto frío tensor y revitalizante.',
                price: 3500,
                duration: 30,
                image: '/services/mascarilla_peel_off.png',
                type: 'facial'
            },
            {
                id: 'hidratacion-velo',
                name: 'Hidratación Facial con Velo',
                description: 'Tratamiento ultra-hidratante con velo de colágeno para pieles sedientas.',
                price: 4000,
                duration: 40,
                image: '/services/hidratacion_facial.png',
                type: 'facial'
            },
        ]
    },
    {
        title: "Cuerpo y Bienestar",
        services: [
            {
                id: 'maderoterapia',
                name: 'Maderoterapia (Sesión suelta)',
                description: 'Técnica de masaje con utensilios de madera para tonificar y reducir celulitis.',
                price: 4250,
                duration: 50,
                image: '/services/maderoterapia.png',
                type: 'body'
            },
            {
                id: 'pack-maderoterapia',
                name: 'Pack Maderoterapia (5 ses.)',
                description: 'Bono ahorro de 5 sesiones completas de maderoterapia corporal.',
                price: 15000,
                duration: 50,
                image: '/services/maderoterapia.png',
                type: 'body'
            },
            {
                id: 'masaje-kobido',
                name: 'Masaje Kobido (Lifting manual)',
                description: 'Lifting facial japonés natural mediante masaje rápido y rítmico.',
                price: 5000,
                duration: 50,
                image: '/services/masaje_kobido.png',
                type: 'body'
            },
            {
                id: 'drenaje-linfatico',
                name: 'Drenaje Linfático',
                description: 'Masaje terapéutico suave que favorece la eliminación de líquidos y toxinas.',
                price: 5000,
                duration: 50,
                image: '/services/drenaje_linfatico.png',
                type: 'body'
            },
        ]
    },
    {
        title: "Mirada y Otros",
        services: [
            {
                id: 'lifting-pestanas',
                name: 'Lifting de Pestañas',
                description: 'Tratamiento que eleva y estira las pestañas desde la raíz.',
                price: 4000,
                duration: 45,
                image: '/services/lifting_pestanas.png',
                type: 'eyes'
            },
            {
                id: 'diseno-cejas',
                name: 'Diseño de Cejas',
                description: 'Depilación y diseño personalizado de cejas según tu rostro.',
                price: 1250,
                duration: 20,
                image: '/services/diseno_cejas.png',
                type: 'eyes'
            },
            {
                id: 'maquillaje',
                name: 'Maquillaje (Evento/Novia)',
                description: 'Servicio de maquillaje profesional para bodas y eventos especiales.',
                price: 4500,
                duration: 60,
                image: '/services/maquillaje.png',
                type: 'eyes'
            },
        ]
    },
    {
        title: "Depilación",
        services: [
            {
                id: 'laser-diodo-mujer',
                name: 'Láser Diodo (Cuerpo completo - Mujer)',
                description: 'Sesión depilación láser diodo cuerpo completo para mujer.',
                price: 12900,
                duration: 75,
                image: '/services/laser_diodo.png',
                type: 'hair_removal'
            },
            {
                id: 'laser-diodo-hombre',
                name: 'Láser Diodo (Cuerpo completo - Hombre)',
                description: 'Sesión depilación láser diodo cuerpo completo para hombre.',
                price: 13900,
                duration: 90,
                image: '/services/laser_diodo.png',
                type: 'hair_removal'
            },
        ]
    }
];

async function main() {
    console.log('Seeding services...');

    // Flatten services
    const allServices = CATEGORIES.flatMap(cat => cat.services);

    for (const service of allServices) {
        await db.insert(services).values({
            id: service.id,
            name: service.name,
            description: service.description,
            price: service.price,
            duration: service.duration,
            imageUrl: service.image,
            type: service.type,
        }).onConflictDoUpdate({
            target: services.id,
            set: {
                name: service.name,
                description: service.description,
                price: service.price,
                duration: service.duration,
                imageUrl: service.image,
                type: service.type,
            }
        });
        console.log(`Synced service: ${service.name}`);
    }

    console.log('Done!');
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
