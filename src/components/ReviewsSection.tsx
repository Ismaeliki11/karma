"use client";

import { useState, useEffect } from "react";
import { Star, MapPin, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";


export function ReviewsSection() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(1);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) setItemsPerPage(3);
            else if (window.innerWidth >= 768) setItemsPerPage(2);
            else setItemsPerPage(1);
        };
        handleResize(); // Initial call
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const next = () => {
        setCurrentIndex((prev) =>
            (prev + itemsPerPage >= REVIEWS.length) ? 0 : prev + 1
        );
    };

    const prev = () => {
        setCurrentIndex((prev) =>
            (prev === 0) ? Math.max(0, REVIEWS.length - itemsPerPage) : prev - 1
        );
    };

    return (
        <section id="opiniones" className="py-16 md:py-24 bg-white border-t border-neutral-100 overflow-hidden">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block py-1 px-3 rounded-full bg-pink-50 text-pink-600 text-xs font-bold tracking-wider uppercase mb-4">
                            Testimonios
                        </span>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-neutral-900">
                            Lo que dicen nuestros clientes
                        </h2>
                        <p className="text-neutral-500 text-lg max-w-2xl mx-auto">
                            La experiencia Karma a través de las palabras de quienes nos eligen cada día.
                        </p>
                    </motion.div>
                </div>

                {/* Carousel Container */}
                <div className="relative mb-16 px-0 md:px-12 group"> {/* Reduced padding on mobile to allow full width usage */}
                    <div className="overflow-hidden">
                        <motion.div
                            className="flex"
                            animate={{ x: `-${currentIndex * (100 / itemsPerPage)}%` }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            {REVIEWS.map((review, index) => (
                                <motion.div
                                    key={index}
                                    className="px-4 md:px-4 flex-shrink-0" /* Added flex-shrink-0 to prevent squasing on mobile */
                                    style={{ width: `${100 / itemsPerPage}%` }}
                                >
                                    <div className="bg-neutral-50 p-6 md:p-8 rounded-3xl relative h-full hover:shadow-xl hover:shadow-pink-100/30 transition-all duration-300 border border-neutral-100 flex flex-col">
                                        <Quote className="absolute top-6 right-6 md:top-8 md:right-8 text-pink-100 w-8 h-8 md:w-10 md:h-10" />

                                        <div className="flex gap-1 mb-4 md:mb-6">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                                            ))}
                                        </div>

                                        <p className="text-neutral-700 mb-6 md:mb-8 text-sm md:text-[15px] leading-relaxed relative z-10 font-medium flex-grow">
                                            "{review.text}"
                                        </p>

                                        <div className="flex items-center gap-4 mt-auto">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center text-pink-700 font-bold text-sm shadow-inner">
                                                {review.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-neutral-900 text-sm">{review.name}</p>
                                                <p className="text-neutral-400 text-xs">Cliente verificado</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Navigation Buttons */}
                    <button
                        onClick={prev}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 md:-ml-6 bg-white border border-neutral-200 p-3 rounded-full shadow-lg text-neutral-600 hover:text-pink-600 hover:border-pink-200 transition-all z-20 hidden md:flex cursor-pointer"
                        aria-label="Previous review"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-0 top-1/2 -translate-y-1/2 -mr-2 md:-mr-6 bg-white border border-neutral-200 p-3 rounded-full shadow-lg text-neutral-600 hover:text-pink-600 hover:border-pink-200 transition-all z-20 hidden md:flex cursor-pointer"
                        aria-label="Next review"
                    >
                        <ChevronRight size={24} />
                    </button>

                    {/* Mobile Indicators */}
                    <div className="flex justify-center gap-2 md:hidden mt-6">
                        {Array.from({ length: Math.ceil(REVIEWS.length / itemsPerPage) }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx * itemsPerPage)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${Math.floor(currentIndex / itemsPerPage) === idx
                                    ? "bg-pink-500 w-6"
                                    : "bg-neutral-200 w-1.5"
                                    }`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Google Maps Disclaimer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center justify-center gap-4 text-center"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-50 border border-neutral-200/60 text-neutral-500 text-sm">
                        <MapPin size={14} />
                        <span>Opiniones y valoraciones obtenidas de Google Maps</span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

const REVIEWS = [
    {
        name: "Ana García",
        text: "Una experiencia maravillosa. El trato es inmejorable y el ambiente te hace desconectar desde que entras. Los resultados del tratamiento facial fueron inmediatos."
    },
    {
        name: "Laura Martínez",
        text: "Increíble profesionalidad. Me hice la manicura y pedicura y quedaron perfectas. Sin duda volveré por el servicio y la amabilidad de todo el equipo."
    },
    {
        name: "Sofia Rodríguez",
        text: "El mejor centro de estética de la zona. Las instalaciones son preciosas y muy limpias. Recomiendo 100% sus masajes relajantes."
    },
    {
        name: "Carmen Ruiz",
        text: "Me recomendaron este centro para un tratamiento corporal y estoy encantada. Resultados visibles desde la primera sesión y el personal es un amor."
    },
    {
        name: "Elena Sánchez",
        text: "Llevo meses viniendo a hacerme las pestañas y no cambio por nada. La delicadeza con la que trabajan y la duración de los resultados es top."
    },
    {
        name: "Maria Dolores",
        text: "Un oasis de paz. Me regalaron un bono y ha sido todo un descubrimiento. La limpieza facial profunda me dejó la piel como nueva."
    }
];
