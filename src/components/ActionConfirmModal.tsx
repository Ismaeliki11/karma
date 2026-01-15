'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isProcessing?: boolean;
    variant?: 'danger' | 'default';
}

export function ActionConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isProcessing = false,
    variant = 'default',
}: Props) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative z-10 p-6 text-center"
                    >
                        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-neutral-100 text-neutral-600'
                            }`}>
                            <AlertCircle size={24} />
                        </div>

                        <h3 className="text-xl font-medium text-neutral-900 mb-2">{title}</h3>
                        <p className="text-sm text-neutral-500 mb-8 px-4 leading-relaxed">
                            {description}
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isProcessing}
                                className="flex-1 py-3 px-4 rounded-xl border border-neutral-200 text-neutral-600 font-medium hover:bg-neutral-50 transition-colors"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isProcessing}
                                className={`flex-1 py-3 px-4 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-colors ${variant === 'danger'
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : 'bg-black hover:bg-neutral-800'
                                    }`}
                            >
                                {isProcessing && <Loader2 size={16} className="animate-spin" />}
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
