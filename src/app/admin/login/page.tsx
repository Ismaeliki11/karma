"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { loginAdmin } from "@/actions/admin-auth";

export default function AdminLoginPage() {
    const [error, setError] = useState("");
    const router = useRouter();



    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-widest uppercase">Karma</h1>
                    <h2 className="mt-4 text-xl font-medium">Acceso Administrador</h2>
                </div>

                <form action={async (formData) => {
                    const res = await loginAdmin(formData);
                    if (res.success) {
                        router.push("/admin");
                    } else {
                        setError(res.error || "Error al iniciar sesión");
                    }
                }} className="mt-8 space-y-6">
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                            <input
                                name="username"
                                type="text"
                                required
                                className="appearance-none block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                            <input
                                name="password"
                                type="password"
                                required
                                className="appearance-none block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm text-center font-medium">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full bg-black text-white py-6">
                        Entrar
                    </Button>
                </form>
            </div>
        </div>
    );
}
