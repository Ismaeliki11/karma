
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, Plus, Trash2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConflictModal } from "./ConflictModal";

interface Exception {
    id: string;
    date: string;
    openTime?: string;
    closeTime?: string;
    breakStart?: string;
    breakEnd?: string;
    isClosed: boolean;
    reason?: string;
}

export function AvailabilityExceptions() {
    const [exceptions, setExceptions] = useState<Exception[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // New Exception State
    const [newDate, setNewDate] = useState("");
    const [isClosed, setIsClosed] = useState(true);
    const [openTime, setOpenTime] = useState("09:00");
    const [closeTime, setCloseTime] = useState("20:00");
    const [breakStart, setBreakStart] = useState("");
    const [breakEnd, setBreakEnd] = useState("");
    const [reason, setReason] = useState("");

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
        if (!newDate) return alert("Selecciona una fecha");

        setConflicts([]);

        try {
            const res = await fetch(`/api/settings/exceptions${force ? '?force=true' : ''}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: newDate,
                    isClosed,
                    openTime: isClosed ? null : openTime,
                    closeTime: isClosed ? null : closeTime,
                    breakStart: (!isClosed && breakStart) ? breakStart : null,
                    breakEnd: (!isClosed && breakEnd) ? breakEnd : null,
                    reason
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setIsAdding(false);
                setNewDate("");
                setReason("");
                setBreakStart("");
                setBreakEnd("");
                setShowConflictModal(false);
                fetchExceptions();
            } else if (res.status === 409) {
                setConflicts(data.conflicts);
                setShowConflictModal(true);
            } else {
                alert(data.error || "Error al guardar excepción");
            }
        } catch (error) {
            alert("Error de conexión");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar esta excepción?")) return;
        try {
            await fetch(`/api/settings/exceptions?id=${id}`, { method: "DELETE" });
            fetchExceptions();
        } catch (error) {
            alert("Error al eliminar");
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
                    <p className="text-sm text-gray-500 mt-1">Cierra días específicos o cambia el horario sin modificar la semana habitual.</p>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)} variant="outline" className="gap-2">
                    <Plus size={18} />
                    {isAdding ? "Cancelar" : "Añadir Excepción"}
                </Button>
            </div>

            {isAdding && (
                <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100 mb-8 animate-in fade-in slide-in-from-top-2">
                    <h4 className="font-bold text-gray-800 mb-4">Nueva Excepción</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Fecha</label>
                            <input
                                type="date"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
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

                        <div className="flex items-end pb-2">
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
                                <span className="text-sm font-bold text-gray-700">Cerrado todo el día</span>
                            </label>
                        </div>

                        {!isClosed && (
                            <>
                                <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Horario Especial</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="time"
                                                value={openTime}
                                                onChange={(e) => setOpenTime(e.target.value)}
                                                className="p-2.5 rounded-xl border border-gray-200 text-sm font-bold w-full focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                                            />
                                            <span className="text-gray-300 font-bold">-</span>
                                            <input
                                                type="time"
                                                value={closeTime}
                                                onChange={(e) => setCloseTime(e.target.value)}
                                                className="p-2.5 rounded-xl border border-gray-200 text-sm font-bold w-full focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Descanso (Opcional)</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="time"
                                                value={breakStart}
                                                onChange={(e) => setBreakStart(e.target.value)}
                                                className="p-2.5 rounded-xl border border-gray-200 text-sm font-medium w-full focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                                            />
                                            <span className="text-gray-300 font-bold">-</span>
                                            <input
                                                type="time"
                                                value={breakEnd}
                                                onChange={(e) => setBreakEnd(e.target.value)}
                                                className="p-2.5 rounded-xl border border-gray-200 text-sm font-medium w-full focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="mt-6 flex justify-end gap-3 border-t border-purple-100 pt-4">
                        <Button
                            onClick={handleAdd.bind(null, false)}
                            className="bg-purple-600 text-white hover:bg-purple-700 font-bold px-6"
                        >
                            Guardar Excepción
                        </Button>
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
                        <div key={ex.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-all group">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${ex.isClosed ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                                    {ex.isClosed ? <AlertCircle size={20} /> : <Clock size={20} />}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 capitalize text-lg">
                                        {format(new Date(ex.date), "EEEE d 'de' MMMM", { locale: es })}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ex.isClosed ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                            {ex.isClosed ? "CERRADO" : `${ex.openTime} - ${ex.closeTime}`}
                                        </span>
                                        {ex.breakStart && !ex.isClosed && (
                                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                                                Descanso: {ex.breakStart}-{ex.breakEnd}
                                            </span>
                                        )}
                                        {ex.reason && <span className="text-sm text-gray-500 font-medium">• {ex.reason}</span>}
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={() => handleDelete(ex.id)}
                                variant="ghost"
                                size="sm"
                                className="text-gray-300 hover:text-red-500 hover:bg-red-50"
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
        </div>
    );
}

