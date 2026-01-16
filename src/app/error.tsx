"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-white text-center px-4 gap-6">
            <div className="p-4 rounded-full bg-red-50 text-red-500">
                <AlertCircle size={48} />
            </div>
            <div className="flex flex-col items-center gap-2">
                <h2 className="text-2xl font-semibold text-gray-900">Algo salió mal</h2>
                <p className="text-gray-500 max-w-md">
                    Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
                </p>
            </div>
            <div className="flex gap-4">
                <Button
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                >
                    Ir al inicio
                </Button>
                <Button
                    className="bg-black text-white hover:bg-gray-800"
                    onClick={reset}
                >
                    Intentar de nuevo
                </Button>
            </div>
        </div>
    );
}
