
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

type Service = {
    id: string;
    name: string;
    description: string | null;
    type: string;
    price: number;
    duration: number;
    imageUrl: string | null;
};

interface ServiceFormProps {
    initialData?: Service | null;
    onSuccess: () => void;
    onCancel: () => void;
}

const SERVICE_TYPES = [
    { value: 'manicure', label: 'Manicura' },
    { value: 'pedicure', label: 'Pedicura' },
    { value: 'facial', label: 'Facial' },
    { value: 'body', label: 'Corporal' },
    { value: 'other', label: 'Otro' },
];

export function ServiceForm({ initialData, onSuccess, onCancel }: ServiceFormProps) {
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        description: initialData?.description || "",
        type: initialData?.type || "manicure",
        price: initialData ? (initialData.price / 100).toString() : "",
        duration: initialData?.duration?.toString() || "30",
        imageUrl: initialData?.imageUrl || "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const data = new FormData();
        data.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: data
            });

            if (res.ok) {
                const json = await res.json();
                setFormData(prev => ({ ...prev, imageUrl: json.url }));
            } else {
                toast.error("Error al subir imagen");
                console.error(await res.text());
            }
        } catch (error) {
            console.error(error);
            toast.error("Error de conexión al subir imagen");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const payload = {
            ...formData,
            price: parseFloat(formData.price) * 100, // Convert to cents
            duration: parseInt(formData.duration),
        };

        try {
            const url = initialData ? `/api/services/${initialData.id}` : "/api/services";
            const method = initialData ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                onSuccess();
            } else {
                toast.error("Error al guardar el servicio");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Servicio</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black/5 focus:outline-none"
                            placeholder="Ej: Manicura Completa"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black/5 focus:outline-none bg-white"
                        >
                            {SERVICE_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Precio (€)</label>
                            <input
                                type="number"
                                name="price"
                                required
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={handleChange}
                                className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black/5 focus:outline-none"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Duración (min)</label>
                            <input
                                type="number"
                                name="duration"
                                required
                                min="5"
                                step="5"
                                value={formData.duration}
                                onChange={handleChange}
                                className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black/5 focus:outline-none"
                                placeholder="30"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
                        <div className="relative aspect-video bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors flex flex-col items-center justify-center overflow-hidden group">
                            {formData.imageUrl ? (
                                <>
                                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            Cambiar Imagen
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-4">
                                    <Upload className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                                    <p className="text-xs text-gray-500 mb-2">Haz clic para subir una imagen</p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Seleccionar
                                    </Button>
                                </div>
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <Loader2 className="animate-spin text-black" />
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black/5 focus:outline-none resize-none"
                    placeholder="Describe qué incluye el servicio..."
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
                    Cancelar
                </Button>
                <Button type="submit" className="bg-black text-white hover:bg-gray-800 gap-2" disabled={submitting || uploading}>
                    {submitting && <Loader2 className="animate-spin" size={16} />}
                    {initialData ? "Guardar Cambios" : "Crear Servicio"}
                </Button>
            </div>
        </form>
    );
}
