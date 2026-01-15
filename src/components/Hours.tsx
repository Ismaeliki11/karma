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
    // Capitalize first letter strictly for comparison if needed, but display nicely

    return (
        <section id="horario" className="py-16 md:py-24 bg-neutral-50 border-t border-neutral-100">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Horarios de Atención</h2>
                    <p className="text-neutral-500 text-lg">
                        Planifica tu visita. Te esperamos para dedicarte el tiempo que mereces.
                    </p>
                </div>

                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-200">
                    <div className="flex items-center gap-4 mb-6 md:mb-8 pb-6 md:pb-8 border-b border-neutral-100">
                        <div className="p-3 bg-pink-50 rounded-full text-pink-600">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Horario Semanal</h3>
                            <p className="text-neutral-500 text-sm">Martes a Sábado (Lunes cerrado)</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {schedule.map((item, index) => (
                            <div
                                key={index}
                                className={`flex justify-between items-center p-4 rounded-xl transition-colors ${item.day.toLowerCase() === today.toLowerCase()
                                    ? "bg-pink-50 border border-pink-100"
                                    : "hover:bg-neutral-50"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full ${item.isOpen ? "bg-green-400" : "bg-neutral-300"}`} />
                                    <span className="font-medium text-neutral-900">{item.day}</span>
                                </div>
                                <span className={`text-sm ${item.isOpen ? "text-neutral-600" : "text-neutral-400 italic"}`}>
                                    {item.hours}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-neutral-100 text-center text-sm text-neutral-400">
                        * Jueves y Viernes sujeto a cambios según disponibilidad (hasta 21:00).
                    </div>
                </div>
            </div>
        </section>
    );
}
