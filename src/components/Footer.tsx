"use client";

import Link from "next/link";
import { Instagram, Facebook } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-gray-50 border-t border-gray-200 py-8 md:py-12">
            <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8">
                <div className="flex flex-col items-center md:items-start gap-2">
                    <span className="text-xl font-bold tracking-widest uppercase">Karma</span>
                    <p className="text-sm text-gray-500">Centro de Estética & Bienestar</p>
                </div>

                <div className="flex items-center gap-6">
                    <Link
                        href="https://instagram.com/centroesteticakarma"
                        target="_blank"
                        className="p-3 rounded-full bg-white border border-gray-200 hover:bg-pink-50 transition-colors text-gray-700 hover:text-pink-600"
                    >
                        <Instagram size={20} />
                    </Link>
                    <Link
                        href="https://facebook.com/centroesteticakarma"
                        target="_blank"
                        className="p-3 rounded-full bg-white border border-gray-200 hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600"
                    >
                        <Facebook size={20} />
                    </Link>
                </div>

                <div className="text-xs text-gray-400">
                    &copy; {new Date().getFullYear()} Karma Estética.
                </div>
            </div>
        </footer>
    );
}
