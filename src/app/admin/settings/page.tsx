
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Megaphone, Save } from "lucide-react";
import { AvailabilityExceptions } from "@/components/admin/AvailabilityExceptions";
import { BusinessHoursEditor } from "@/components/admin/BusinessHoursEditor";

// Simple Switch Component
function SimpleSwitch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
    return (
        <button
            type="button"
            className={`${checked ? 'bg-black' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2`}
            role="switch"
            aria-checked={checked}
            onClick={() => onCheckedChange(!checked)}
        >
            <span
                aria-hidden="true"
                className={`${checked ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
        </button>
    );
}

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);

    // Notice State
    const [notice, setNotice] = useState({ active: false, message: "" });
    const [savingNotice, setSavingNotice] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const noticeRes = await fetch("/api/settings/notice");
                const noticeData = await noticeRes.json();
                setNotice(noticeData);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleSaveNotice = async () => {
        setSavingNotice(true);
        try {
            const res = await fetch("/api/settings/notice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(notice),
            });
            if (res.ok) {
                alert("Aviso actualizado correctamente");
            } else {
                alert("Error al guardar aviso");
            }
        } catch (error) {
            alert("Error de conexión");
        } finally {
            setSavingNotice(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-500 font-medium">Cargando configuración...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-24">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">Configuración</h2>
                <p className="text-gray-500 mt-1">Gestiona el horario, las excepciones y los avisos de la web.</p>
            </div>

            {/* Public Notice Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Megaphone size={20} className="text-pink-500" />
                            Avisos Públicos
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Muestra un mensaje importante en la página principal.</p>
                    </div>
                    <SimpleSwitch
                        checked={notice.active}
                        onCheckedChange={(checked) => setNotice(prev => ({ ...prev, active: checked }))}
                    />
                </div>

                <div className="space-y-4">
                    <textarea
                        value={notice.message}
                        onChange={(e) => setNotice(prev => ({ ...prev, message: e.target.value }))}
                        disabled={!notice.active}
                        className={`w-full p-4 rounded-xl border ${notice.active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 text-gray-400'} focus:ring-2 focus:ring-black/5 focus:outline-none transition-colors min-h-[100px] font-medium resize-none`}
                        placeholder="Escribe el mensaje aquí (ej: 'Cerrado por vacaciones del 1 al 15 de agosto')..."
                    />
                    <div className="flex justify-end">
                        <Button onClick={handleSaveNotice} disabled={savingNotice} variant="outline" className="gap-2">
                            {savingNotice ? <Save className="animate-spin" size={16} /> : <Save size={16} />}
                            {savingNotice ? "Guardando..." : "Guardar Aviso"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Business Hours Section (New Component) */}
            <BusinessHoursEditor />

            {/* Exceptions Section (Updated Component) */}
            <AvailabilityExceptions />
        </div>
    );
}

