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
                {error && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg text-left w-full max-w-md overflow-x-auto border border-red-100">
                        <p className="font-mono text-xs text-red-800 break-words font-semibold">
                            {error.message || "Error desconocido"}
                        </p>
                        {error.digest && (
                            <p className="font-mono text-[10px] text-red-500 mt-1">
                                Digest: {error.digest}
                            </p>
                        )}
                        {error.stack && (
                            <pre className="font-mono text-[10px] text-gray-500 mt-2 whitespace-pre-wrap max-h-40 overflow-y-auto">
                                {error.stack}
                            </pre>
                        )}
                        {/* Optional: Show stack trace in development only, but useful here if it isn't stripped */}
                    </div>
                )}
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
        </div >
    );
}
