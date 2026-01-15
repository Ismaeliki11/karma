
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Loader2, Image as ImageIcon, Sparkles } from "lucide-react";
import { ServiceForm } from "@/components/admin/ServiceForm";

type Service = {
    id: string;
    name: string;
    description: string;
    type: string;
    price: number;
    duration: number;
    imageUrl: string | null;
};

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    const fetchServices = async () => {
        try {
            const res = await fetch("/api/services");
            if (res.ok) {
                const data = await res.json();
                setServices(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este servicio?")) return;

        try {
            const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
            if (res.ok) {
                setServices(prev => prev.filter(s => s.id !== id));
            } else {
                alert("Error al eliminar el servicio");
            }
        } catch (error) {
            alert("Error de conexión");
        }
    };

    const handleEdit = (service: Service) => {
        setEditingService(service);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingService(null);
        setIsFormOpen(true);
    };

    const handleFormSuccess = () => {
        setIsFormOpen(false);
        setEditingService(null);
        fetchServices();
    };

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={32} /></div>;

    if (isFormOpen) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">{editingService ? "Editar Servicio" : "Nuevo Servicio"}</h2>
                    <Button variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <ServiceForm
                        initialData={editingService}
                        onSuccess={handleFormSuccess}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Servicios</h2>
                    <p className="text-gray-500 mt-1">Gestiona los servicios que ofreces a tus clientes.</p>
                </div>
                <Button onClick={handleAddNew} className="bg-black text-white hover:bg-gray-800 gap-2">
                    <Plus size={18} />
                    Nuevo Servicio
                </Button>
            </div>

            {Object.entries(services.reduce((acc, service) => {
                const type = service.type || 'Otros';
                if (!acc[type]) acc[type] = [];
                acc[type].push(service);
                return acc;
            }, {} as Record<string, Service[]>)).map(([type, typeServices]) => (
                <div key={type} className="mb-10">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 capitalize border-b border-gray-100 pb-2">
                        {type === 'hands' ? 'Manos' :
                            type === 'feet' ? 'Pies' :
                                type === 'facial' ? 'Facial' :
                                    type === 'body' ? 'Corporal' : type}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {typeServices.map((service) => (
                            <div key={service.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                                <div className="relative h-48 bg-gray-100">
                                    {service.imageUrl ? (
                                        <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <ImageIcon size={32} />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <button
                                            onClick={() => handleEdit(service)}
                                            className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
                                        >
                                            <Edit size={14} className="text-gray-700" />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{service.name}</h3>
                                        <span className="bg-pink-50 text-pink-700 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
                                            {service.duration} min
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">{service.description}</p>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                                        <span className="font-bold text-lg">{(service.price / 100).toFixed(2)}€</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDelete(service.id)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {services.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <Sparkles className="text-gray-400" size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No hay servicios</h3>
                    <p className="text-gray-500 mt-1 mb-6">Empieza añadiendo tu primer servicio.</p>
                    <Button onClick={handleAddNew} variant="outline">Añadir Servicio</Button>
                </div>
            )}
        </div>
    );
}
