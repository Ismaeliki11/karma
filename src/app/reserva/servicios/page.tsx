
'use client';

import { useBooking } from '@/context/BookingContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

import { useServices } from '@/hooks/useServices';
import { Loader2 } from 'lucide-react';

export default function ServiciosPage() {
    const { booking, updateBooking } = useBooking();
    const router = useRouter();
    const { categories, loading } = useServices();

    const handleSelect = (service: any) => {
        updateBooking({
            serviceId: service.id,
            serviceName: service.name,
            servicePrice: service.price,
            serviceDuration: service.duration,
            serviceImage: service.imageUrl || '',
            selectedOptions: [], // Reset options on new service
        });
    };

    const handleNext = () => {
        if (booking.serviceId) {
            router.push('/reserva/calendario');
        }
    };

    return (
        <div className="space-y-8 md:space-y-12 pb-24">
            <div className="text-center px-4">
                <h1 className="text-2xl md:text-3xl font-light tracking-wide text-neutral-900">Nuestros Servicios</h1>
                <p className="mt-2 text-sm md:text-base text-neutral-500">Calidad y dedicación en cada detalle</p>
            </div>

            <div className="space-y-8 md:space-y-12 px-2 md:px-0">
                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="animate-spin text-neutral-400" size={32} />
                    </div>
                ) : categories.map((category) => (
                    <div key={category.title} className="space-y-6">
                        <h2 className="text-xl font-medium border-b border-neutral-100 pb-2">{category.title}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {category.services.map((service) => (
                                <motion.div
                                    key={service.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSelect(service)}
                                    className={cn(
                                        "cursor-pointer group relative overflow-hidden rounded-xl border transition-all duration-300 flex md:flex-col bg-white",
                                        booking.serviceId === service.id
                                            ? "border-black shadow-lg ring-1 ring-black"
                                            : "border-neutral-100 hover:border-neutral-300 hover:shadow-sm"
                                    )}
                                >
                                    {/* Mobile: 1/4 width (w-1/4 -> 25%). Desktop: Full width aspect ratio */}
                                    <div className="w-1/4 relative aspect-square md:w-full md:aspect-[4/3] shrink-0 bg-neutral-100">
                                        {service.imageUrl ? (
                                            <Image
                                                src={service.imageUrl}
                                                alt={service.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                                <span className="text-xs">Sin foto</span>
                                            </div>
                                        )}
                                        {booking.serviceId === service.id && (
                                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center md:items-start md:justify-end md:p-4 md:bg-transparent">
                                                <div className="bg-black text-white p-1 md:p-2 rounded-full shadow-sm">
                                                    <Check size={14} className="md:w-4 md:h-4" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 p-4 flex flex-col justify-center md:justify-start">
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="font-medium text-base md:text-lg leading-tight">{service.name}</h3>
                                            <span className="font-semibold text-sm md:text-base shrink-0">
                                                {(service.price / 100).toFixed(0)}€
                                            </span>
                                        </div>
                                        <p className="text-xs text-neutral-500 mt-1 line-clamp-2 md:text-sm md:line-clamp-none md:mt-2">
                                            {service.description}
                                        </p>
                                        <div className="mt-2 md:mt-auto md:pt-4">
                                            <span className="text-xs text-neutral-400 bg-neutral-50 px-2 py-1 rounded-md">
                                                {service.duration} min
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-neutral-100 flex justify-center z-50">
                <button
                    onClick={handleNext}
                    disabled={!booking.serviceId}
                    className={cn(
                        "flex items-center justify-center gap-2 px-8 py-3 rounded-full transition-all duration-300 font-medium shadow-md w-full md:w-auto",
                        booking.serviceId
                            ? "bg-black text-white hover:bg-neutral-800"
                            : "bg-white text-neutral-300 border border-neutral-200 cursor-not-allowed"
                    )}
                >
                    <span className="text-base">Continuar</span>
                    {booking.serviceId && (
                        <motion.span
                            initial={{ x: 0 }}
                            animate={{ x: 3 }}
                            transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.6 }}
                            className="shrink-0"
                        >
                            <ArrowRight size={20} />
                        </motion.span>
                    )}
                </button>
            </div>
        </div>
    );
}
