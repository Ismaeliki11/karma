'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sendMagicLink } from '@/actions/auth';
import { Loader2, Mail, ArrowRight, CheckCircle, Hash, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MisReservasPage() {
    const [mode, setMode] = useState<'email' | 'code'>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (mode === 'email') {
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
        } else {
            // Code Mode
            try {
                // We verify if the code exists by calling the action we just created
                // But we can also just redirect and let the page handle it.
                // For better UX, let's verify first (client-side check of format? or server check?)
                // Let's just redirect to the dynamic page, if it doesn't exist, that page will show error.
                // Actually, the plan said "Call getBookingByLocator". But we can't import server action directly in client component IF it's not passed as prop or imported from a server file.
                // 'actions/client-bookings' IS a server file ('use server'). So we CAN import it.

                // Dynamic import to avoid issues if not needed? No, standard import is fine.
                // I need to add the import first.
                // Wait, I missed adding the import in the previous step? No, I'm editing the file now.
                // I need to add `import { getBookingByLocator } from '@/actions/client-bookings';`
                // But this `replace_file_content` block is replacing the FUNCTION, not imports.
                // I should assume I'll add the import in a separate tool call or use `multi_replace`.

                // Let's do the redirect strategy for simplicity and speed, 
                // but checking existence first is nicer. 
                // Let's assume I will import `getBookingByLocator` at the top.

                // For now, let's just redirect to /mis-reservas/reserva/[code]
                // and let that page handle the validation.
                router.push(`/mis-reservas/reserva/${code}`);

            } catch (err) {
                setError('Algo salió mal.');
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4 relative">
            {/* Header / Navigation */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-neutral-600 hover:text-black transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Volver</span>
                </Link>

                <Link href="/" className="text-xl font-bold tracking-widest uppercase absolute left-1/2 -translate-x-1/2">
                    Karma
                </Link>
            </div>
            <div className="w-full max-w-sm space-y-8 text-center">

                <div className="space-y-2">
                    <h1 className="text-3xl font-light tracking-tight text-neutral-900">
                        {mode === 'email' ? 'Mis Reservas' : 'Acceso con Código'}
                    </h1>
                    <p className="text-neutral-500 text-sm">
                        {mode === 'email'
                            ? 'Introduce tu email para gestionar tus citas sin contraseña.'
                            : 'Introduce el código de tu reserva para gestionarla.'}
                    </p>
                </div>

                {isSent && mode === 'email' ? (
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
                            <div className="mt-3 bg-white/60 p-3 rounded-lg text-green-800 text-xs flex gap-2 items-start">
                                <span className="text-lg">⚠️</span>
                                <p><strong>Importante:</strong> Si no lo ves, revisa tu carpeta de <strong>Spam o Correo no deseado</strong> (Gmail a veces lo esconde ahí).</p>
                            </div>
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
                            {mode === 'email' ? (
                                <>
                                    <Mail className="absolute left-4 top-3.5 text-neutral-400" size={18} />
                                    <input
                                        type="email"
                                        required
                                        placeholder="tu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all placeholder:text-neutral-400"
                                    />
                                </>
                            ) : (
                                <>
                                    <Hash className="absolute left-4 top-3.5 text-neutral-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: ABC-123"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                        className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all placeholder:text-neutral-400 uppercase font-mono"
                                    />
                                </>
                            )}
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
                                    <span>{mode === 'email' ? 'Enviar enlace de acceso' : 'Acceder a la reserva'}</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                <div className="pt-4 border-t border-neutral-100">
                    <button
                        onClick={() => {
                            setMode(mode === 'email' ? 'code' : 'email');
                            setError(null);
                            setIsSent(false);
                        }}
                        className="text-sm text-neutral-500 hover:text-black transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                        {mode === 'email' ? (
                            <>
                                <span>Tengo un código de reserva</span>
                                <ArrowRight size={14} />
                            </>
                        ) : (
                            <>
                                <ArrowRight size={14} className="rotate-180" />
                                <span>Acceder con email</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
