"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, User, MessageCircle } from "lucide-react"; // Using MessageCircle as WhatsApp replacement
import { Button } from "@/components/ui/button";

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BookingModal({ isOpen, onClose }: BookingModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        service: "Manicura",
        date: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // WhatsApp URL Construction
        const message = `Hola, soy ${formData.name}. Me gustaría reservar una cita para *${formData.service}* el día ${formData.date}.`;
        const url = `https://wa.me/34600000000?text=${encodeURIComponent(message)}`; // Placeholder number
        window.open(url, "_blank");
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 z-50"
                    >
                        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden relative border border-white/20">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-200 to-neutral-200" />

                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 transition-colors"
                            >
                                <X size={20} className="text-neutral-500" />
                            </button>

                            <div className="p-6">
                                <h3 className="text-2xl font-bold mb-2">Reserva tu Cita</h3>
                                <p className="text-neutral-500 mb-6 text-sm">
                                    Completa tus datos y te atenderemos por WhatsApp para confirmar disponibilidad.
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium ml-1">Nombre</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                            <input
                                                required
                                                type="text"
                                                placeholder="Tu nombre"
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-pink-100 transition-all"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium ml-1">Servicio</label>
                                        <div className="relative">
                                            <select
                                                className="w-full pl-4 pr-10 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-pink-100 transition-all appearance-none"
                                                value={formData.service}
                                                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                                            >
                                                <option>Manicura</option>
                                                <option>Pedicura</option>
                                                <option>Limpieza Facial</option>
                                                <option>Masaje Relajante</option>
                                                <option>Tratamiento Corporal</option>
                                                <option>Otro</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium ml-1">Fecha Preferida</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                            <input
                                                required
                                                type="date"
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-pink-100 transition-all"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full py-6 mt-4 text-base rounded-xl group bg-black hover:bg-neutral-800">
                                        Continuar en WhatsApp
                                        <MessageCircle className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
