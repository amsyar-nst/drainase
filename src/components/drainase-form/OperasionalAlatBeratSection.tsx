import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { KegiatanDrainase, OperasionalAlatBerat } from "@/types/laporan";
import { alatBeratOptions } from "@/data/kecamatan-kelurahan";
import { ComboboxInput } from "@/components/ComboboxInput"; // Import the new ComboboxInput

interface OperasionalAlatBeratSectionProps {
  currentKegiatan: KegiatanDrainase;
  updateCurrentKegiatan: (updates: Partial<KegiatanDrainase>) => void;
}

export const OperasionalAlatBeratSection: React.FC<OperasionalAlatBeratSectionProps> = ({
  currentKegiatan,
  updateCurrentKegiatan,
}) => {
  const addOperasionalAlatBerat = () => {
    const newOperasional: OperasionalAlatBerat = {
      id: Date.now().toString(),
      jenis: "",
      jumlah: 1,
    };
    updateCurrentKegiatan({
      operasionalAlatBerats: [...currentKegiatan.operasionalAlatBerats, newOperasional],
    });
  };

  const removeOperasionalAlatBerat = (id: string) => {
    if (currentKegiatan.operasionalAlatBerats.length > 1) {
      updateCurrentKegiatan({
        operasionalAlatBerats: currentKegiatan.operasionalAlatBerats.filter((o) => o.id !== id),
      });
    }
  };

  const updateOperasionalAlatBerat = (id: string, field: keyof OperasionalAlatBerat, value: string | number) => {
    updateCurrentKegiatan({
      operasionalAlatBerats: currentKegiatan.operasionalAlatBerats.map((o) =>
        o.id === id ? { ...o, [field]: value } : o
      ),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Operasional Alat Berat</Label>
        <Button type="button" variant="outline" size="sm" onClick={addOperasionalAlatBerat}>
          <Plus className="h-4 w-4 mr-1" />
          Tambah
        </Button>
      </div>
      {currentKegiatan.operasionalAlatBerats.map((operasional) => (
        <div key={operasional.id} className="grid gap-4 md:grid-cols-3 items-end">
          <div className="space-y-2 md:col-span-2">
            <Label>Jenis Alat Berat</Label>
            <ComboboxInput
              options={alatBeratOptions}
              value={operasional.jenis}
              onValueChange={(value) => updateOperasionalAlatBerat(operasional.id, "jenis", value)}
              placeholder="Pilih atau ketik jenis alat berat"
              emptyMessage="Tidak ada alat berat ditemukan."
            />
          </div>
          <div className="space-y-2">
            <Label>Jumlah</Label>
            <Input
              type="number"
              min="1"
              value={operasional.jumlah}
              onChange={(e) => updateOperasionalAlatBerat(operasional.id, "jumlah", parseInt(e.target.value) || 1)}
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={() => removeOperasionalAlatBerat(operasional.id)}
            disabled={currentKegiatan.operasionalAlatBerats.length === 1}
            className="md:col-start-3"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};