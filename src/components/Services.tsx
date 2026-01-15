"use client";

import { motion } from "framer-motion";
import { Sparkles, Activity, Gem } from "lucide-react"; // Using available icons
import { Button } from "@/components/ui/button";

import { useServices, Category } from "@/hooks/useServices";
import { Loader2 } from "lucide-react";

const ICON_MAP: Record<string, any> = {
    'Manicura y Manos': Sparkles,
    'Pedicura y Pies': Sparkles,
    'Tratamientos Faciales': Gem,
    'Tratamientos Corporales': Activity,
    'Otros Servicios': Sparkles,
};

const COLOR_MAP: Record<string, string> = {
    'Manicura y Manos': "bg-pink-50 text-pink-900",
    'Pedicura y Pies': "bg-pink-50 text-pink-900",
    'Tratamientos Faciales': "bg-neutral-50 text-neutral-900",
    'Tratamientos Corporales': "bg-stone-50 text-stone-900",
    'Otros Servicios': "bg-gray-50 text-gray-900",
};

export function Services() {
    const { categories, loading } = useServices();

    if (loading) return <div className="py-24 flex justify-center"><Loader2 className="animate-spin text-gray-300" /></div>;

    // We want to show categories as "Services" cards
    // If we have "Manicura y Manos" and "Pedicura y Pies", maybe keep them separate or just show what's available.

    return (
        <section id="servicios" className="py-16 md:py-24 bg-white relative">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Nuestros Servicios</h2>
                    <p className="text-neutral-500 text-lg">
                        Combinamos técnicas tradicionales con tecnología moderna para ofrecerte resultados visibles y duraderos.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {categories.map((category, index) => {
                        const Icon = ICON_MAP[category.title] || Sparkles;
                        const colorClass = COLOR_MAP[category.title] || "bg-gray-50 text-gray-900";
                        // Generate a generic description or take first service desc?
                        // Let's use a generic description based on title or leave empty/short
                        const description = category.services.length + " servicios disponibles";

                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="group p-6 md:p-8 rounded-3xl border border-neutral-100 bg-white hover:border-pink-100 hover:shadow-xl hover:shadow-pink-100/20 transition-all duration-300"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${colorClass} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon size={28} />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-neutral-900 group-hover:text-pink-900 transition-colors">{category.title}</h3>
                                <p className="text-neutral-500 mb-6 leading-relaxed">
                                    {description}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
