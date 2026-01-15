'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useServices } from '@/hooks/useServices';
import { Loader2 } from 'lucide-react';

interface Props {
    bookingId: string;
    currentServiceId: string;
    token: string;
}

export function ChangeServiceClient({ bookingId, currentServiceId, token }: Props) {
    const router = useRouter();
    const { categories, loading } = useServices();

    const handleSelect = (serviceId: string) => {
        // Redirect to reschedule page with newServiceId param
        // This forces the user to pick/confirm a time slot for the NEW service duration
        router.push(`/mis-reservas/reprogramar/${bookingId}?token=${token}&newServiceId=${serviceId}`);
    };

    return (
        <div className="min-h-screen bg-[#FDFBF9] pb-20 selection:bg-black selection:text-white">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-neutral-100 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 hover:bg-neutral-50 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-sm font-medium uppercase tracking-wide text-neutral-500">Cambiar Servicio</h1>
                    <div className="w-8"></div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                <p className="text-neutral-500">
                    Selecciona el nuevo servicio que deseas realizar.
                    <br />
                    <span className="text-xs text-neutral-400">Nota: Al cambiar de servicio tendrás que confirmar de nuevo la hora.</span>
                </p>

                <div className="space-y-12">
                    {loading ? (
                        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-gray-400" /></div>
                    ) : categories.map((category) => (
                        <div key={category.title} className="space-y-6">
                            <h2 className="text-xl font-medium border-b border-neutral-100 pb-2">{category.title}</h2>
                            <div className="grid grid-cols-1 gap-4">
                                {category.services.map((service) => (
                                    <motion.div
                                        key={service.id}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSelect(service.id)}
                                        className={cn(
                                            "cursor-pointer group relative overflow-hidden rounded-2xl border transition-all duration-300 flex bg-white",
                                            currentServiceId === service.id
                                                ? "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/10"
                                                : "border-neutral-100 hover:border-neutral-300 hover:shadow-md"
                                        )}
                                    >
                                        <div className="w-24 md:w-32 relative aspect-square shrink-0 bg-gray-100">
                                            {service.imageUrl && (
                                                <Image
                                                    src={service.imageUrl}
                                                    alt={service.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            )}
                                        </div>

                                        <div className="flex-1 p-4 flex flex-col justify-center">
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="font-medium text-lg leading-tight text-neutral-900">{service.name}</h3>
                                                {currentServiceId === service.id && (
                                                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Actual</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                                                {service.description}
                                            </p>
                                            <div className="mt-3 flex items-center gap-3 text-xs font-medium text-neutral-400">
                                                <span className="bg-neutral-100 px-2 py-1 rounded-md text-neutral-600">
                                                    {service.duration} min
                                                </span>
                                                <span>•</span>
                                                <span>{(service.price / 100).toFixed(0)}€</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
