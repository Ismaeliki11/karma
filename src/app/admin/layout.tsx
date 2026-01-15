"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Calendar, Users, Menu, Settings, Sparkles } from "lucide-react";
import { logoutAdmin } from "@/actions/admin-auth";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;
    const isLoginPage = pathname === "/admin/login";

    const handleLogout = async () => {
        await logoutAdmin();
    };

    if (isLoginPage) {
        return <div className="min-h-screen bg-white">{children}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* --- DESKTOP SIDEBAR (Hidden on Mobile) --- */}
            <aside className="hidden md:flex w-64 bg-black text-white p-6 flex-col sticky top-0 h-screen">
                <div className="mb-10 text-center">
                    <h1 className="text-2xl font-bold tracking-widest uppercase">Karma</h1>
                    <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
                </div>

                <nav className="flex-1 space-y-4">
                    <Link
                        href="/admin"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin') ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'}`}
                    >
                        <Calendar size={20} />
                        <span>Reservas</span>
                    </Link>
                    <Link
                        href="/admin/clients"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/clients') ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        <Users size={20} />
                        <span>Clientes</span>
                    </Link>
                    <Link
                        href="/admin/services"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/services') ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        <Sparkles size={20} />
                        <span>Servicios</span>
                    </Link>
                    <Link
                        href="/admin/settings"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/settings') ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        <Settings size={20} />
                        <span>Configuración</span>
                    </Link>
                </nav>

                <button
                    onClick={handleLogout}
                    className="mt-auto flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                    <LogOut size={20} />
                    <span>Cerrar Sesión</span>
                </button>
            </aside>

            {/* --- MOBILE HEADER (Visible only on Mobile) --- */}
            <header className="md:hidden bg-black text-white p-4 sticky top-0 z-30 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg tracking-widest uppercase">Karma</span>
                    <span className="text-xs text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">Admin</span>
                </div>
                <button onClick={handleLogout} className="text-gray-400 hover:text-white">
                    <LogOut size={20} />
                </button>
            </header>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
                {children}
            </main>

            {/* --- MOBILE BOTTOM NAV (Visible only on Mobile) --- */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] safe-area-pb">
                <Link
                    href="/admin"
                    className={`flex flex-col items-center gap-1 ${isActive('/admin') ? 'text-black' : 'text-gray-400'}`}
                >
                    <Calendar size={24} strokeWidth={isActive('/admin') ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Reservas</span>
                </Link>
                <Link
                    href="/admin/clients"
                    className={`flex flex-col items-center gap-1 ${isActive('/admin/clients') ? 'text-black' : 'text-gray-400'}`}
                >
                    <Users size={24} strokeWidth={isActive('/admin/clients') ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Clientes</span>
                </Link>
                <Link
                    href="/admin/services"
                    className={`flex flex-col items-center gap-1 ${isActive('/admin/services') ? 'text-black' : 'text-gray-400'}`}
                >
                    <Sparkles size={24} strokeWidth={isActive('/admin/services') ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Servicios</span>
                </Link>
                <Link
                    href="/admin/settings"
                    className={`flex flex-col items-center gap-1 ${isActive('/admin/settings') ? 'text-black' : 'text-gray-400'}`}
                >
                    <Settings size={24} strokeWidth={isActive('/admin/settings') ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Ajustes</span>
                </Link>
            </nav>
        </div>
    );
}
