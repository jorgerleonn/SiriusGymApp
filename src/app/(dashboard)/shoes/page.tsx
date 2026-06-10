"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { MStripe } from "@/components/ui/m-stripe";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";

interface Shoe {
  id: string;
  name: string;
  brand?: string;
  color?: string;
  total_distance: number;
}

function ShoeForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isEditing, 
  loading 
}: { 
  initialData?: Partial<Shoe>; 
  onSubmit: (data: Partial<Shoe>) => Promise<void>; 
  onCancel: () => void; 
  isEditing: boolean; 
  loading: boolean; 
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    brand: initialData?.brand || "",
    color: initialData?.color || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="bg-surface-card border border-hairline p-lg h-fit">
      <h3 className="text-label-uppercase text-primary tracking-[1.5px] mb-md">
        {isEditing ? "EDITAR ZAPATILLA" : "AÑADIR ZAPATILLA"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-sm">
        <div>
          <label className="block text-caption text-muted mb-xs tracking-[1px]">NOMBRE</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full bg-canvas border border-hairline p-sm text-primary rounded-lg focus:border-primary outline-none transition-colors"
            placeholder="Ej. Nike Pegasus 40"
            required
          />
        </div>
        <div>
          <label className="block text-caption text-muted mb-xs tracking-[1px]">MARCA</label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
            className="w-full bg-canvas border border-hairline p-sm text-primary rounded-lg focus:border-primary outline-none transition-colors"
            placeholder="Ej. Nike"
          />
        </div>
        <div>
          <label className="block text-caption text-muted mb-xs tracking-[1px]">COLOR</label>
          <input
            type="text"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            className="w-full bg-canvas border border-hairline p-sm text-primary rounded-lg focus:border-primary outline-none transition-colors"
            placeholder="Ej. Azul"
          />
        </div>
        <div className="flex gap-xs pt-md">
          {!isEditing ? (
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white p-sm rounded-lg font-bold text-caption tracking-[1px] hover:bg-primary/90 transition-colors flex items-center justify-center gap-sm"
            >
              <Plus className="w-4 h-4" /> AÑADIR
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-canvas border border-hairline text-muted p-sm rounded-lg font-bold text-caption tracking-[1px] hover:text-primary transition-colors flex items-center justify-center gap-sm"
              >
                <X className="w-4 h-4" /> CANCELAR
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white p-sm rounded-lg font-bold text-caption tracking-[1px] hover:bg-primary/90 transition-colors flex items-center justify-center gap-sm"
              >
                <Save className="w-4 h-4" /> GUARDAR
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

export default function ShoesPage() {
  const { user, isLoaded } = useUser();
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingShoe, setEditingShoe] = useState<Shoe | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      fetchShoes();
    }
  }, [isLoaded, user]);

  const fetchShoes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shoes");
      const data = await res.json();
      setShoes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching shoes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdateShoe = async (formData: Partial<Shoe>) => {
    setLoading(true);
    try {
      const url = editingShoe ? `/api/shoes/${editingShoe.id}` : "/api/shoes";
      const method = editingShoe ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        setEditingShoe(null);
        await fetchShoes();
      }
    } catch (err) {
      console.error("Error saving shoe:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShoe = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta zapatilla?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/shoes/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchShoes();
      }
    } catch (err) {
      console.error("Error deleting shoe:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <div className="flex items-center justify-center min-h-screen text-muted">CARGANDO...</div>;

  return (
    <div>
      <MStripe className="mb-lg" />
      <h1 className="text-display-md font-display text-primary tracking-[0] mb-xl">
        ZAPATILLAS
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        <ShoeForm 
          key={editingShoe?.id || 'new'}
           initialData={editingShoe ?? undefined} 
          onSubmit={handleAddOrUpdateShoe} 
          onCancel={() => setEditingShoe(null)} 
          isEditing={!!editingShoe} 
          loading={loading} 
        />

        <div className="lg:col-span-2 space-y-sm">
          {loading && shoes.length === 0 ? (
            <div className="text-center py-xxl text-muted">CARGANDO...</div>
          ) : shoes.length === 0 ? (
            <div className="text-center py-xxl border border-hairline text-muted italic">
              No hay zapatillas registradas.
            </div>
          ) : (
            shoes.map((shoe) => (
              <div
                key={shoe.id}
                className="bg-surface-card border border-hairline p-md rounded-xl flex items-center justify-between hover:border-primary/50 transition-colors"
              >
                <div>
                  <p className="text-label-uppercase text-primary font-display tracking-[0]">
                    {shoe.name} {shoe.brand && <span className="text-muted text-caption">({shoe.brand})</span>}
                  </p>
                  <p className="text-caption text-muted tracking-[1px]">
                    DISTANCIA TOTAL: <span className="text-primary font-bold">{shoe.total_distance.toFixed(2)} km</span>
                  </p>
                </div>
                <div className="flex gap-xs">
                  <button
                    onClick={() => setEditingShoe(shoe)}
                    className="p-sm bg-canvas border border-hairline rounded-lg text-muted hover:text-primary transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteShoe(shoe.id)}
                    className="p-sm bg-canvas border border-hairline rounded-lg text-muted hover:text-m-red transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
