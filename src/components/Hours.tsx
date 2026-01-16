"use client";

import { Clock, Calendar } from "lucide-react";

const schedule = [
    { day: "Lunes", hours: "Cerrado", isOpen: false },
    { day: "Martes", hours: "10:00 – 14:00 | 17:00 – 20:00", isOpen: true },
    { day: "Miércoles", hours: "10:00 – 14:00 | 17:00 – 20:00", isOpen: true },
    { day: "Jueves", hours: "10:00 – 14:00 | 17:00 – 20:00", isOpen: true },
    { day: "Viernes", hours: "10:00 – 14:00 | 17:00 – 20:00", isOpen: true },
    { day: "Sábado", hours: "10:00 – 14:00", isOpen: true },
    { day: "Domingo", hours: "Cerrado", isOpen: false },
];

export function Hours() {
    const today = new Date().toLocaleDateString('es-ES', { weekday: 'long' });

    return (
        <section id="horario" className="py-16 md:py-24 bg-neutral-50 border-t border-neutral-100">
            <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-neutral-900">Horarios de Atención</h2>
                    <p className="text-neutral-500 text-lg">
                        Planifica tu visita. Te esperamos para dedicarte el tiempo que mereces.
                    </p>
                </div>

                <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl shadow-neutral-100/50 border border-neutral-200/60 transition-all hover:shadow-2xl hover:shadow-neutral-200/50">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-neutral-100">
                        <div className="p-3.5 bg-pink-50 rounded-2xl text-pink-500">
                            <Clock size={26} strokeWidth={2} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-neutral-900">Horario Semanal</h3>
                            <p className="text-neutral-500 text-sm font-medium">Martes a Sábado</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {schedule.map((item, index) => {
                            const isToday = item.day.toLowerCase() === today.toLowerCase();
                            return (
                                <div
                                    key={index}
                                    className={`
                                        group flex flex-col sm:flex-row sm:items-center justify-between
                                        p-4 rounded-xl transition-all duration-300 border
                                        ${isToday
                                            ? "bg-pink-50/60 border-pink-100 shadow-sm"
                                            : "bg-transparent border-transparent hover:bg-neutral-50"
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                        <div className={`
                                            w-2 h-2 rounded-full ring-2 ring-white
                                            ${item.isOpen ? "bg-emerald-400" : "bg-neutral-300"}
                                        `} />
                                        <span className={`
                                            font-medium text-lg
                                            ${isToday ? "text-pink-900" : "text-neutral-700 group-hover:text-neutral-900"}
                                        `}>
                                            {item.day}
                                        </span>
                                    </div>

                                    <div className={`
                                        pl-5 sm:pl-0 text-[15px] sm:text-base font-medium
                                        ${item.isOpen ? "text-neutral-600" : "text-neutral-400 italic"}
                                    `}>
                                        {item.hours}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
                        <p className="text-sm text-neutral-400 font-medium">
                            * Jueves y Viernes sujeto a cambios según disponibilidad (hasta 21:00).
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
