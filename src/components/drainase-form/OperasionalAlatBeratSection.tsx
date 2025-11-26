import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { KegiatanDrainase, OperasionalAlatBerat } from "@/types/laporan";
import { alatBeratOptions } from "@/data/kecamatan-kelurahan";

interface OperasionalAlatBeratSectionProps {
  currentKegiatan: KegiatanDrainase;
  updateCurrentKegiatan: (updates: Partial<KegiatanDrainase>) => void;
}

export const OperasionalAlatBeratSection: React.FC<OperasionalAlatBeratSectionProps> = ({
  currentKegiatan,
  updateCurrentKegiatan,
}) => {
  // State to manage custom input for each operasional item
  const [customJenisAlatBerat, setCustomJenisAlatBerat] = useState<Record<string, string>>({});

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
      // Also remove custom input state if it exists
      setCustomJenisAlatBerat(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
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

  const handleJenisAlatBeratChange = (id: string, value: string) => {
    if (value === "custom") {
      // Set the jenis to an empty string or a placeholder to indicate custom input
      updateOperasionalAlatBerat(id, "jenis", "");
      setCustomJenisAlatBerat(prev => ({ ...prev, [id]: "" }));
    } else {
      updateOperasionalAlatBerat(id, "jenis", value);
      setCustomJenisAlatBerat(prev => {
        const newState = { ...prev };
        delete newState[id]; // Remove custom input state if a predefined option is selected
        return newState;
      });
    }
  };

  const handleCustomJenisAlatBeratChange = (id: string, value: string) => {
    setCustomJenisAlatBerat(prev => ({ ...prev, [id]: value }));
    updateOperasionalAlatBerat(id, "jenis", value);
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
            <Select
              value={alatBeratOptions.includes(operasional.jenis) ? operasional.jenis : "custom"}
              onValueChange={(value) => handleJenisAlatBeratChange(operasional.id, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis alat berat" />
              </SelectTrigger>
              <SelectContent>
                {alatBeratOptions.map((jenis) => (
                  <SelectItem key={jenis} value={jenis}>
                    {jenis}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Lainnya (Input Manual)</SelectItem>
              </SelectContent>
            </Select>
            {(!alatBeratOptions.includes(operasional.jenis) || operasional.jenis === "") && (
              <Input
                type="text"
                placeholder="Masukkan jenis alat berat manual"
                value={customJenisAlatBerat[operasional.id] !== undefined ? customJenisAlatBerat[operasional.id] : operasional.jenis}
                onChange={(e) => handleCustomJenisAlatBeratChange(operasional.id, e.target.value)}
                className="mt-2"
              />
            )}
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