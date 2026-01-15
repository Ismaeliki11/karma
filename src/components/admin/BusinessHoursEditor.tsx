
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock, Save, AlertCircle, RefreshCw } from "lucide-react";
import { ConflictModal } from "./ConflictModal";
import { toast } from "sonner";

interface BusinessDay {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    breakStart: string | null;
    breakEnd: string | null;
    isClosed: boolean;
}

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function BusinessHoursEditor() {
    const [hours, setHours] = useState<BusinessDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [conflicts, setConflicts] = useState<any[]>([]);
    const [showConflictModal, setShowConflictModal] = useState(false);

    useEffect(() => {
        fetchHours();
    }, []);

    const fetchHours = async () => {
        try {
            const res = await fetch("/api/settings/business-hours");
            const data = await res.json();
            // Ensure 0-6 sort
            setHours(data.sort((a: BusinessDay, b: BusinessDay) => a.dayOfWeek - b.dayOfWeek).map((d: BusinessDay) => ({
                ...d,
                breakStart: d.breakStart || "14:00",
                breakEnd: d.breakEnd || "16:00"
            })));
        } catch (error) {
            console.error("Failed to load hours");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (index: number, field: keyof BusinessDay, value: any) => {
        const newHours = [...hours];
        newHours[index] = { ...newHours[index], [field]: value };
        setHours(newHours);
    };

    const handleSave = async (force = false) => {
        setSaving(true);
        setConflicts([]);

        try {
            const res = await fetch(`/api/settings/business-hours${force ? '?force=true' : ''}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(hours),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Horario guardado correctamente");
                setShowConflictModal(false);
            } else if (res.status === 409) {
                setConflicts(data.conflicts);
                setShowConflictModal(true);
            } else {
                toast.error(data.error || "Error al guardar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando horario...</div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Clock size={20} className="text-blue-500" />
                        Horario Semanal Base
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Define el horario habitual. Se aplicará a todas las semanas futuras.</p>
                </div>
                <Button onClick={() => handleSave(false)} disabled={saving} className="bg-black text-white hover:bg-neutral-800 gap-2">
                    {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    {saving ? "Guardando..." : "Guardar Cambios"}
                </Button>
            </div>

            <div className="space-y-4">

                <div className="divide-y divide-gray-100">
                    {hours.map((day, index) => (
                        <div key={day.dayOfWeek} className={`py-4 transition-colors ${day.isClosed ? 'opacity-50 grayscale' : ''}`}>
                            <div className="flex flex-col md:flex-row md:items-center gap-4">

                                <div className="flex items-center justify-between md:w-40 shrink-0">
                                    <span className="font-bold text-gray-900 w-24">{DAYS[day.dayOfWeek]}</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={!day.isClosed}
                                            onChange={(e) => handleChange(index, 'isClosed', !e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                                    </label>
                                </div>

                                {!day.isClosed && (
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] uppercase font-bold text-gray-400">Jornada</span>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="time"
                                                    value={day.openTime}
                                                    onChange={(e) => handleChange(index, 'openTime', e.target.value)}
                                                    className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm font-bold focus:ring-2 focus:ring-black outline-none w-full"
                                                />
                                                <span className="text-gray-300">-</span>
                                                <input
                                                    type="time"
                                                    value={day.closeTime}
                                                    onChange={(e) => handleChange(index, 'closeTime', e.target.value)}
                                                    className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm font-bold focus:ring-2 focus:ring-black outline-none w-full"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] uppercase font-bold text-gray-400">Descanso</span>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="time"
                                                    value={day.breakStart || "14:00"}
                                                    onChange={(e) => handleChange(index, 'breakStart', e.target.value)}
                                                    className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm font-medium text-gray-600 focus:ring-2 focus:ring-black outline-none w-full"
                                                />
                                                <span className="text-gray-300">-</span>
                                                <input
                                                    type="time"
                                                    value={day.breakEnd || "16:00"}
                                                    onChange={(e) => handleChange(index, 'breakEnd', e.target.value)}
                                                    className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm font-medium text-gray-600 focus:ring-2 focus:ring-black outline-none w-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {day.isClosed && (
                                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full self-start md:self-center">CERRADO</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showConflictModal && (
                <ConflictModal
                    conflicts={conflicts}
                    onCancel={() => setShowConflictModal(false)}
                    onConfirm={() => handleSave(true)}
                />
            )}
        </div>
    );
}
