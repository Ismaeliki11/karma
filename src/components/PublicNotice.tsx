
"use client";

import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PublicNotice() {
    const [notice, setNotice] = useState<{ active: boolean; message: string } | null>(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        async function fetchNotice() {
            try {
                const res = await fetch("/api/settings/notice");
                if (res.ok) {
                    const data = await res.json();
                    if (data.active && data.message) {
                        setNotice(data);
                    }
                }
            } catch (error) {
                console.error("Error fetching notice:", error);
            }
        }
        fetchNotice();
    }, []);

    if (!notice || !isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="relative bg-neutral-900 text-white py-3 px-4 md:px-6 z-40 mt-20 md:mt-24"
            >
                <div className="container mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-pink-500 rounded-lg shrink-0">
                            <Megaphone size={16} className="text-white" />
                        </div>
                        <p className="text-sm md:text-base font-medium leading-tight">
                            <span className="font-bold text-pink-400 mr-2 uppercase tracking-wider text-[10px] md:text-xs bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">Aviso Importante</span>
                            {notice.message}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white"
                        aria-label="Cerrar aviso"
                    >
                        <X size={18} />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
