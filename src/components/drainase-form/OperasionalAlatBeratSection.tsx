import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { KegiatanDrainase, OperasionalAlatBerat } from "@/types/laporan";

// Import the new item component
import { OperasionalAlatBeratItemForm } from "./OperasionalAlatBeratItemForm";

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
      jumlah: 0,
      dexliteJumlah: "",
      dexliteSatuan: "Liter",
      pertaliteJumlah: "",
      pertaliteSatuan: "Liter",
      bioSolarJumlah: "",
      bioSolarSatuan: "Liter",
      keterangan: "",
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
      <Label>Operasional Alat Berat</Label>
      {currentKegiatan.operasionalAlatBerats.map((operasional) => (
        <OperasionalAlatBeratItemForm
          key={operasional.id}
          operasional={operasional}
          updateOperasionalAlatBerat={updateOperasionalAlatBerat}
          removeOperasionalAlatBerat={removeOperasionalAlatBerat}
          isRemoveDisabled={currentKegiatan.operasionalAlatBerats.length === 1}
        />
      ))}
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={addOperasionalAlatBerat}>
          <Plus className="h-4 w-4 mr-1" />
          Tambah Operasional Alat Berat
        </Button>
      </div>
    </div>
  );
};