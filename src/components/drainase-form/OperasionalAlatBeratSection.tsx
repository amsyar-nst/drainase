import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { KegiatanDrainase, OperasionalAlatBerat } from "@/types/laporan";
import { alatBeratOptions } from "@/data/kecamatan-kelurahan";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface OperasionalAlatBeratSectionProps {
  currentKegiatan: KegiatanDrainase;
  updateCurrentKegiatan: (updates: Partial<KegiatanDrainase>) => void;
  // operasionalCustomInputs: Record<string, string>; // Removed
  // setOperasionalCustomInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>; // Removed
  reportType: "harian" | "bulanan" | "tersier"; // New prop
}

export const OperasionalAlatBeratSection: React.FC<OperasionalAlatBeratSectionProps> = ({
  currentKegiatan,
  updateCurrentKegiatan,
  // operasionalCustomInputs, // Removed
  // setOperasionalCustomInputs, // Removed
  reportType, // Destructure new prop
}) => {
  // No longer need local state for operasionalCustomInputs here, it's passed via props.

  // Effect to initialize custom inputs when currentKegiatan changes (e.g., on load or activity switch)
  // This useEffect is no longer needed as custom inputs are handled directly in the `jenis` field.
  // useEffect(() => {
  //   const initialOperasionalCustomInputs: Record<string, string> = {};
  //   currentKegiatan.operasionalAlatBerats.forEach(op => {
  //     if (!alatBeratOptions.includes(op.jenis) && op.jenis !== "") {
  //       initialOperasionalCustomInputs[op.id] = op.jenis;
  //       op.jenis = "custom"; 
  //     }
  //   });
  //   setOperasionalCustomInputs(initialOperasionalCustomInputs);
  // }, [currentKegiatan.operasionalAlatBerats, setOperasionalCustomInputs]);


  const addOperasionalAlatBerat = () => {
    const newOperasional: OperasionalAlatBerat = {
      id: Date.now().toString(),
      jenis: "",
      jumlah: 0, // Default to 0 for empty display
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
      // setOperasionalCustomInputs((prev) => { // Removed
      //   const newInputs = { ...prev };
      //   delete newInputs[id];
      //   return newInputs;
      // });
    }
  };

  const updateOperasionalAlatBerat = (id: string, field: keyof OperasionalAlatBerat, value: string | number) => {
    updateCurrentKegiatan({
      operasionalAlatBerats: currentKegiatan.operasionalAlatBerats.map((o) => {
        if (o.id === id) {
          const updatedOperasional = { ...o, [field]: value };
          if (field === "jenis") {
            if (alatBeratOptions.includes(value as string)) {
              // No default unit logic for heavy equipment type, just set the value
            } else if (value === "custom") {
              updatedOperasional.jenis = ""; // Set to empty string for custom input
            }
          }
          return updatedOperasional; // Ensure updatedOperasional is returned
        }
        return o;
      }),
    });
  };

  // const updateOperasionalCustomInput = (id: string, value: string) => { // Removed
  //   setOperasionalCustomInputs((prev) => ({ ...prev, [id]: value }));
  // };

  return (
    <div className="space-y-4">
      <Label>Operasional Alat Berat</Label>
      {currentKegiatan.operasionalAlatBerats.map((operasional) => (
        <div key={operasional.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border-b pb-4 last:border-b-0 last:pb-0">
          {/* Jenis Alat Berat */}
          <div className="space-y-2 md:col-span-3">
            <Label>Jenis Alat Berat</Label>
            <Select
              value={alatBeratOptions.includes(operasional.jenis) ? operasional.jenis : "custom"}
              onValueChange={(value) => updateOperasionalAlatBerat(operasional.id, "jenis", value)}
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
                <SelectItem value="custom">Lainnya</SelectItem>
              </SelectContent>
            </Select>
            {!alatBeratOptions.includes(operasional.jenis) && ( // <--- Perubahan di sini
              <Input
                type="text"
                placeholder="Masukkan jenis alat berat manual"
                value={operasional.jenis}
                onChange={(e) => updateOperasionalAlatBerat(operasional.id, "jenis", e.target.value)}
                className="mt-2"
              />
            )}
          </div>
          {/* Jumlah */}
          <div className="space-y-2 md:col-span-1">
            <Label>Jumlah</Label>
            <Input
              type="text"
              placeholder="0"
              value={operasional.jumlah === 0 ? "" : operasional.jumlah.toString()}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || /^\d{0,2}$/.test(value)) {
                  updateOperasionalAlatBerat(operasional.id, "jumlah", parseInt(value, 10));
                }
              }}
              maxLength={2}
            />
          </div>
          {/* Conditional fields for Harian/Bulanan */}
          {reportType !== "tersier" && (
            <>
              {/* Dexlite Jumlah */}
              <div className="space-y-2 md:col-span-1">
                <Label>Dexlite</Label>
                <Input
                  type="text"
                  placeholder="Jumlah (L)"
                  value={operasional.dexliteJumlah}
                  onChange={(e) => updateOperasionalAlatBerat(operasional.id, "dexliteJumlah", e.target.value)}
                />
              </div>
              {/* Pertalite Jumlah */}
              <div className="space-y-2 md:col-span-1">
                <Label>Pertalite</Label>
                <Input
                  type="text"
                  placeholder="Jumlah (L)"
                  value={operasional.pertaliteJumlah}
                  onChange={(e) => updateOperasionalAlatBerat(operasional.id, "pertaliteJumlah", e.target.value)}
                />
              </div>
              {/* Bio Solar Jumlah */}
              <div className="space-y-2 md:col-span-1">
                <Label>Bio Solar</Label>
                <Input
                  type="text"
                  placeholder="Jumlah (L)"
                  value={operasional.bioSolarJumlah}
                  onChange={(e) => updateOperasionalAlatBerat(operasional.id, "bioSolarJumlah", e.target.value)}
                />
              </div>
              {/* Keterangan */}
              <div className="space-y-2 md:col-span-3">
                <Label>Keterangan</Label>
                <Textarea
                  placeholder="Catatan tambahan"
                  value={operasional.keterangan}
                  onChange={(e) => updateOperasionalAlatBerat(operasional.id, "keterangan", e.target.value)}
                  rows={1}
                />
              </div>
            </>
          )}
          {/* Remove Button */}
          <div className="md:col-span-1 flex justify-end">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => removeOperasionalAlatBerat(operasional.id)}
              disabled={currentKegiatan.operasionalAlatBerats.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
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