'use client';

import { useState } from 'react';
import { sendMagicLink } from '@/actions/auth';
import { Loader2, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MisReservasPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await sendMagicLink(email);
            if (res.success) {
                setIsSent(true);
            } else {
                setError(res.error || 'Error desconocido');
            }
        } catch (err) {
            setError('Error de conexión. Inténtalo más tarde.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
            <div className="w-full max-w-sm space-y-8 text-center">

                <div className="space-y-2">
                    <h1 className="text-3xl font-light tracking-tight text-neutral-900">Mis Reservas</h1>
                    <p className="text-neutral-500 text-sm">
                        Introduce tu email para gestionar tus citas sin contraseña.
                    </p>
                </div>

                {isSent ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-50 p-6 rounded-2xl border border-green-100 space-y-4"
                    >
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <h3 className="text-green-900 font-medium">¡Enlace enviado!</h3>
                            <p className="text-green-700 text-sm mt-1">
                                Revisa tu correo ({email}). Hemos enviado un enlace mágico para acceder.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsSent(false)}
                            className="text-xs text-green-700 underline underline-offset-2 hover:text-green-900"
                        >
                            ¿Te equivocaste de correo?
                        </button>
                    </motion.div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-neutral-400" size={18} />
                            <input
                                type="email"
                                required
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all placeholder:text-neutral-400"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    <span>Enviar enlace de acceso</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
