import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { KegiatanDrainase, Peralatan } from "@/types/laporan";

interface PeralatanSectionProps {
  currentKegiatan: KegiatanDrainase;
  updateCurrentKegiatan: (updates: Partial<KegiatanDrainase>) => void;
}

export const PeralatanSection: React.FC<PeralatanSectionProps> = ({
  currentKegiatan,
  updateCurrentKegiatan,
}) => {
  const addPeralatan = () => {
    const newPeralatan: Peralatan = {
      id: Date.now().toString(),
      nama: "",
      jumlah: 1,
    };
    updateCurrentKegiatan({
      peralatans: [...currentKegiatan.peralatans, newPeralatan],
    });
  };

  const removePeralatan = (id: string) => {
    if (currentKegiatan.peralatans.length > 1) {
      updateCurrentKegiatan({
        peralatans: currentKegiatan.peralatans.filter((p) => p.id !== id),
      });
    }
  };

  const updatePeralatan = (id: string, field: keyof Peralatan, value: string | number) => {
    updateCurrentKegiatan({
      peralatans: currentKegiatan.peralatans.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Peralatan yang Digunakan</Label>
        <Button type="button" variant="outline" size="sm" onClick={addPeralatan}>
          <Plus className="h-4 w-4 mr-1" />
          Tambah
        </Button>
      </div>
      {currentKegiatan.peralatans.map((peralatan) => (
        <div key={peralatan.id} className="grid gap-4 md:grid-cols-3 items-end">
          <div className="space-y-2 md:col-span-2">
            <Label>Nama Peralatan</Label>
            <Input
              value={peralatan.nama}
              onChange={(e) => updatePeralatan(peralatan.id, "nama", e.target.value)}
              placeholder="Contoh: Excavator"
            />
          </div>
          <div className="space-y-2">
            <Label>Jumlah</Label>
            <Input
              type="number"
              min="1"
              value={peralatan.jumlah}
              onChange={(e) => updatePeralatan(peralatan.id, "jumlah", parseInt(e.target.value) || 1)}
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={() => removePeralatan(peralatan.id)}
            disabled={currentKegiatan.peralatans.length === 1}
            className="md:col-start-3"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};