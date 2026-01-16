
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navLinks = [
    { name: "Servicios", href: "/#servicios" }, // Updated to absolute path to work from inner pages
    { name: "Horario", href: "/#horario" },
    { name: "Mis Reservas", href: "/mis-reservas" },
];

interface NavbarProps {
    onBook?: () => void;
}

export function Navbar({ onBook }: NavbarProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const router = useRouter();

    const handleBook = () => {
        if (onBook) {
            onBook();
        } else {
            router.push('/reserva');
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            if (typeof window !== "undefined") {
                setIsScrolled(window.scrollY > 20);
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                isScrolled ? "bg-white/90 backdrop-blur-md shadow-sm py-2 md:py-3" : "bg-transparent py-4 md:py-6"
            )}
        >
            <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="text-2xl font-bold tracking-widest uppercase">
                    Karma
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-sm font-medium hover:text-gray-600 transition-colors"
                        >
                            {link.name}
                        </Link>
                    ))}
                    <Button
                        variant="default"
                        size="sm"
                        className="bg-black text-white hover:bg-gray-800"
                        onClick={handleBook}
                    >
                        Pedir Cita
                    </Button>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden p-2 text-foreground"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-t border-gray-200 overflow-hidden absolute top-full left-0 right-0 shadow-lg"
                    >
                        <div className="flex flex-col p-6 gap-4 items-center">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-lg font-medium py-2"
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <Button
                                className="w-full mt-2 bg-black text-white"
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    handleBook();
                                }}
                            >
                                Pedir Cita
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
