
"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Conflict {
    bookingId: string;
    customerName: string;
    date: string;
    time: string;
    reason: string;
}

interface ConflictModalProps {
    conflicts: Conflict[];
    onCancel: () => void;
    onConfirm: () => void;
}

export function ConflictModal({ conflicts, onCancel, onConfirm }: ConflictModalProps) {
    const router = useRouter();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 bg-red-50 border-b border-red-100">
                    <h3 className="text-xl font-bold text-red-700 flex items-center gap-2">
                        <AlertCircle size={24} />
                        ¡Atención! Conflictos Detectados
                    </h3>
                    <p className="text-sm text-red-800 mt-2 leading-relaxed">
                        El cambio de horario que intentas guardar entra en conflicto con <strong>{conflicts.length} reservas existentes</strong>.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-0 bg-white">
                    <div className="divide-y divide-gray-100">
                        {conflicts.map((conflict, idx) => (
                            <div key={`${conflict.bookingId}-${idx}`} className="p-4 hover:bg-gray-50 flex justify-between items-start group transition-colors">
                                <div>
                                    <p className="font-bold text-gray-900 capitalize text-sm">
                                        {format(new Date(conflict.date), "EEEE d 'de' MMMM", { locale: es })}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-0.5">
                                        {conflict.time} · <span className="font-medium text-gray-900">{conflict.customerName}</span>
                                    </p>
                                    <div className="mt-2 flex items-start gap-1.5">
                                        <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                                        <p className="text-xs text-red-600 font-medium">
                                            {conflict.reason}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => window.open(`/admin?date=${conflict.date}`, '_blank')}
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-400 hover:text-black gap-1 h-8 px-2"
                                    title="Ver día en calendario"
                                >
                                    <ArrowRight size={16} />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col gap-3">
                    <div className="text-xs text-gray-500 mb-2 text-center">
                        Si guardas ahora, el horario cambiará pero estas reservas <strong>NO se cancelarán automáticamente</strong>. Quedarán como "inconsistentes".
                    </div>
                    <Button
                        onClick={onConfirm}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-11"
                    >
                        Entiendo, Guardar de todos modos
                    </Button>
                    <Button
                        onClick={onCancel}
                        variant="outline"
                        className="w-full h-11 bg-white hover:bg-gray-100"
                    >
                        Cancelar y Revisar
                    </Button>
                </div>
            </div>
        </div>
    );
}
