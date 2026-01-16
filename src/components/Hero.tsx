"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface HeroProps {
    onBook: () => void;
}

export function Hero({ onBook }: HeroProps) {
    return (
        <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-start md:items-center justify-center overflow-hidden bg-white pt-32 pb-12 md:py-0">
            {/* Background Decor */}
            <div className="absolute top-[-10%] md:top-[-20%] right-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-pink-100 mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
            <div className="absolute top-[-10%] md:top-[-20%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-gray-100 mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
            <div className="absolute bottom-[-10%] md:bottom-[-20%] left-[10%] md:left-[20%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-pink-50 mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />

            <div className="container relative mx-auto px-4 md:px-6 text-center z-10 flex flex-col items-center gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <span className="inline-block py-1 px-3 rounded-full bg-white/50 border border-neutral-200 text-xs font-semibold tracking-wider uppercase mb-4 text-neutral-500 backdrop-blur-sm">
                        Estética Avanzada & Bienestar
                    </span>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-neutral-900 mb-6 max-w-4xl mx-auto">
                        Descubre tu mejor versión en <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-800 to-neutral-500">Karma</span>
                    </h1>
                    <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto mb-8 leading-relaxed">
                        Un espacio dedicado al cuidado de tu cuerpo y mente. Tratamientos personalizados en un ambiente minimalista y relajante.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="flex flex-col sm:flex-row gap-4"
                >
                    <Button size="lg" className="rounded-full px-8 text-md group" onClick={onBook}>
                        Reserva tu Cita
                        <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                    <Button variant="outline" size="lg" className="rounded-full px-8 text-md glass hover:bg-white/60">
                        Ver Servicios
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}
