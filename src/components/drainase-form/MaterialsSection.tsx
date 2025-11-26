import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { KegiatanDrainase, Material } from "@/types/laporan";
import { satuanOptions, materialDefaultUnits } from "@/data/kecamatan-kelurahan";

interface MaterialsSectionProps {
  currentKegiatan: KegiatanDrainase;
  updateCurrentKegiatan: (updates: Partial<KegiatanDrainase>) => void;
}

export const MaterialsSection: React.FC<MaterialsSectionProps> = ({
  currentKegiatan,
  updateCurrentKegiatan,
}) => {
  const addMaterial = () => {
    const newMaterial: Material = {
      id: Date.now().toString(),
      jenis: "",
      jumlah: "",
      satuan: "M³",
    };
    updateCurrentKegiatan({
      materials: [...currentKegiatan.materials, newMaterial],
    });
  };

  const removeMaterial = (id: string) => {
    if (currentKegiatan.materials.length > 1) {
      updateCurrentKegiatan({
        materials: currentKegiatan.materials.filter((m) => m.id !== id),
      });
    }
  };

  const updateMaterial = (id: string, field: keyof Material, value: string) => {
    updateCurrentKegiatan({
      materials: currentKegiatan.materials.map((m) => {
        if (m.id === id) {
          const updatedMaterial = { ...m, [field]: value };
          
          // Auto-fill satuan when jenis changes
          if (field === "jenis" && value) {
            const normalizedJenis = value.toLowerCase().trim();
            const defaultUnit = materialDefaultUnits[normalizedJenis];
            if (defaultUnit) {
              updatedMaterial.satuan = defaultUnit;
            }
          }
          
          return updatedMaterial;
        }
        return m;
      }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Material yang Digunakan</Label>
        <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
          <Plus className="h-4 w-4 mr-1" />
          Tambah
        </Button>
      </div>
      {currentKegiatan.materials.map((material) => (
        <div key={material.id} className="grid gap-4 md:grid-cols-4 items-end">
          <div className="space-y-2">
            <Label>Jenis Material</Label>
            <Input
              value={material.jenis}
              onChange={(e) => updateMaterial(material.id, "jenis", e.target.value)}
              placeholder="Contoh: Pasir"
            />
          </div>
          <div className="space-y-2">
            <Label>Jumlah</Label>
            <Input
              value={material.jumlah}
              onChange={(e) => updateMaterial(material.id, "jumlah", e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label>Satuan</Label>
            <Select
              value={material.satuan}
              onValueChange={(value) => updateMaterial(material.id, "satuan", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {satuanOptions.map((satuan) => (
                  <SelectItem key={satuan} value={satuan}>
                    {satuan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={() => removeMaterial(material.id)}
            disabled={currentKegiatan.materials.length === 1}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};