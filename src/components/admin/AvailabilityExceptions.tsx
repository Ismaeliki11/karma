
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, Plus, Trash2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConflictModal } from "./ConflictModal";
import { ActionConfirmModal } from "@/components/ActionConfirmModal";
import { toast } from "sonner";

interface Exception {
    id: string;
    startDate: string;
    endDate: string;
    morningStart?: string;
    morningEnd?: string;
    afternoonStart?: string;
    afternoonEnd?: string;
    isClosed: boolean;
    reason?: string;
}

export function AvailabilityExceptions() {
    const [exceptions, setExceptions] = useState<Exception[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // New Exception State
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isClosed, setIsClosed] = useState(true);

    const [morningStart, setMorningStart] = useState("");
    const [morningEnd, setMorningEnd] = useState("");
    const [afternoonStart, setAfternoonStart] = useState("");
    const [afternoonEnd, setAfternoonEnd] = useState("");

    const [reason, setReason] = useState("");

    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // Conflict State
    const [conflicts, setConflicts] = useState<any[]>([]);
    const [showConflictModal, setShowConflictModal] = useState(false);

    const fetchExceptions = async () => {
        try {
            const res = await fetch("/api/settings/exceptions");
            if (res.ok) {
                const data = await res.json();
                setExceptions(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExceptions();
    }, []);

    const handleAdd = async (force = false) => {
        if (!startDate || !endDate) {
            toast.error("Selecciona fecha inicio y fin");
            return;
        }

        setConflicts([]);

        try {
            const res = await fetch(`/api/settings/exceptions${force ? '?force=true' : ''}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    startDate,
                    endDate,
                    isClosed,
                    morningStart: (!isClosed && morningStart) ? morningStart : null,
                    morningEnd: (!isClosed && morningEnd) ? morningEnd : null,
                    afternoonStart: (!isClosed && afternoonStart) ? afternoonStart : null,
                    afternoonEnd: (!isClosed && afternoonEnd) ? afternoonEnd : null,
                    reason
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setIsAdding(false);
                setStartDate("");
                setEndDate("");
                setReason("");
                setMorningStart("");
                setMorningEnd("");
                setAfternoonStart("");
                setAfternoonEnd("");
                setShowConflictModal(false);
                fetchExceptions();
            } else if (res.status === 409) {
                setConflicts(data.conflicts);
                setShowConflictModal(true);
            } else {
                toast.error(data.error || "Error al guardar excepción");
            }
        } catch (error) {
            toast.error("Error de conexión");
        }
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await fetch(`/api/settings/exceptions?id=${confirmDeleteId}`, { method: "DELETE" });
            fetchExceptions();
            toast.success("Excepción eliminada");
        } catch (error) {
            toast.error("Error al eliminar");
        } finally {
            setConfirmDeleteId(null);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <CalendarIcon size={20} className="text-purple-500" />
                        Días Festivos / Excepciones
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Cierra días específicos o cambia el horario. Puedes seleccionar rangos de fechas.</p>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)} variant="outline" className="gap-2">
                    <Plus size={18} />
                    {isAdding ? "Cancelar" : "Añadir Excepción"}
                </Button>
            </div>

            {isAdding && (
                <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100 mb-8 animate-in fade-in slide-in-from-top-2">
                    <h4 className="font-bold text-gray-800 mb-4">Nueva Excepción</h4>

                    <div className="space-y-6">
                        {/* Dates and Reason */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Fecha Inicio</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        if (!endDate) setEndDate(e.target.value);
                                    }}
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Fecha Fin</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={startDate}
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Motivo (Opcional)</label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Ej: Festivo Local"
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Closed Toggle */}
                        <div className="flex items-center pb-2">
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isClosed ? 'bg-purple-600' : 'bg-gray-300'}`}>
                                    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${isClosed ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                                <input
                                    type="checkbox"
                                    checked={isClosed}
                                    onChange={(e) => setIsClosed(e.target.checked)}
                                    className="hidden"
                                />
                                <span className="text-sm font-bold text-gray-700">Cerrado todo el periodo</span>
                            </label>
                        </div>

                        {/* Hours Inputs */}
                        {!isClosed && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white/50 rounded-xl border border-purple-100/50">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                        Mañana
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="time"
                                            value={morningStart}
                                            onChange={(e) => setMorningStart(e.target.value)}
                                            className="p-2.5 rounded-xl border border-gray-200 text-sm font-bold w-full focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            placeholder="--:--"
                                        />
                                        <span className="text-gray-300 font-bold">-</span>
                                        <input
                                            type="time"
                                            value={morningEnd}
                                            onChange={(e) => setMorningEnd(e.target.value)}
                                            className="p-2.5 rounded-xl border border-gray-200 text-sm font-bold w-full focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            placeholder="--:--"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                                        Tarde
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="time"
                                            value={afternoonStart}
                                            onChange={(e) => setAfternoonStart(e.target.value)}
                                            className="p-2.5 rounded-xl border border-gray-200 text-sm font-bold w-full focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                                            placeholder="--:--"
                                        />
                                        <span className="text-gray-300 font-bold">-</span>
                                        <input
                                            type="time"
                                            value={afternoonEnd}
                                            onChange={(e) => setAfternoonEnd(e.target.value)}
                                            className="p-2.5 rounded-xl border border-gray-200 text-sm font-bold w-full focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                                            placeholder="--:--"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                onClick={handleAdd.bind(null, false)}
                                className="bg-purple-600 text-white hover:bg-purple-700 font-bold px-6"
                            >
                                Guardar Excepción
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {loading ? (
                    <p className="text-sm text-gray-400">Cargando...</p>
                ) : exceptions.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <CalendarIcon className="mx-auto text-gray-300 mb-2" size={32} />
                        <p className="text-sm text-gray-400 font-medium">No hay días festivos configurados.</p>
                    </div>
                ) : (
                    exceptions.map((ex) => (
                        <div key={ex.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-all group gap-4">
                            <div className="flex items-start md:items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${ex.isClosed ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                                    {ex.isClosed ? <AlertCircle size={20} /> : <Clock size={20} />}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-lg">
                                        {format(new Date(ex.startDate), "d MMM", { locale: es })}
                                        {ex.startDate !== ex.endDate && ` - ${format(new Date(ex.endDate), "d MMM", { locale: es })}`}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        {ex.isClosed ? (
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                                CERRADO
                                            </span>
                                        ) : (
                                            <>
                                                {ex.morningStart && (
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                                        M: {ex.morningStart}-{ex.morningEnd}
                                                    </span>
                                                )}
                                                {ex.afternoonStart && (
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
                                                        T: {ex.afternoonStart}-{ex.afternoonEnd}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                        {ex.reason && <span className="text-sm text-gray-500 font-medium md:ml-1">• {ex.reason}</span>}
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={() => setConfirmDeleteId(ex.id)}
                                variant="ghost"
                                size="sm"
                                className="text-gray-300 hover:text-red-500 hover:bg-red-50 self-end md:self-auto"
                            >
                                <Trash2 size={18} />
                            </Button>
                        </div>
                    ))
                )}
            </div>

            {showConflictModal && (
                <ConflictModal
                    conflicts={conflicts}
                    onCancel={() => setShowConflictModal(false)}
                    onConfirm={() => handleAdd(true)}
                />
            )}

            <ActionConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={handleDelete}
                title="¿Eliminar Excepción?"
                description="Se restablecerá el horario habitual para este periodo."
                confirmText="Eliminar"
                variant="danger"
            />
        </div>
    );
}

