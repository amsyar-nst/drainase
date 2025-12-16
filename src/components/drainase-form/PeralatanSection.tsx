import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { KegiatanDrainase, Peralatan } from "@/types/laporan";
import { peralatanOptions, satuanOptions, peralatanDefaultUnits } from "@/data/kecamatan-kelurahan";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PeralatanSectionProps {
  currentKegiatan: KegiatanDrainase;
  updateCurrentKegiatan: (updates: Partial<KegiatanDrainase>) => void;
  peralatanCustomInputs: Record<string, string>;
  setPeralatanCustomInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  reportType: "harian" | "bulanan" | "tersier"; // New prop
}

export const PeralatanSection: React.FC<PeralatanSectionProps> = ({
  currentKegiatan,
  updateCurrentKegiatan,
  peralatanCustomInputs,
  setPeralatanCustomInputs,
  reportType, // Destructure new prop
}) => {
  const addPeralatan = () => {
    const newPeralatan: Peralatan = {
      id: "peralatan-" + Date.now().toString(),
      nama: "",
      jumlah: 1,
      satuan: "Unit",
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
      setPeralatanCustomInputs((prev) => {
        const newInputs = { ...prev };
        delete newInputs[id];
        return newInputs;
      });
    }
  };

  const updatePeralatan = (id: string, field: keyof Peralatan, value: string | number) => {
    updateCurrentKegiatan({
      peralatans: currentKegiatan.peralatans.map((p) => {
        if (p.id === id) {
          const updatedPeralatan = { ...p, [field]: value };
          if (field === "nama") {
            if (value === "custom") {
              updatedPeralatan.nama = "custom"; // Keep "custom" for the select
              setPeralatanCustomInputs((prev) => ({ ...prev, [id]: "" })); // Initialize custom input
            } else {
              setPeralatanCustomInputs((prev) => {
                const newInputs = { ...prev };
                delete newInputs[id];
                return newInputs;
              });
              const normalizedNama = (value as string).toLowerCase().trim();
              const defaultUnit = peralatanDefaultUnits[normalizedNama];
              if (defaultUnit) {
                updatedPeralatan.satuan = defaultUnit; // Set default unit
              } else {
                updatedPeralatan.satuan = "Unit"; // Fallback default unit
              }
            }
          }
          return updatedPeralatan;
        }
        return p;
      }),
    });
  };

  const updatePeralatanCustomInput = (id: string, value: string) => {
    setPeralatanCustomInputs((prev) => ({ ...prev, [id]: value }));
    // DO NOT update p.nama in currentKegiatan.peralatans here.
    // The actual p.nama in the form state should remain "custom"
    // when the "Lainnya" option is selected in the dropdown.
    // The parent component (DrainaseForm) will resolve this when saving.
  };

  return (
    <div className="space-y-4">
      <Label>Peralatan yang Digunakan</Label>
      {currentKegiatan.peralatans.map((peralatan) => (
        <div key={peralatan.id} className="grid gap-4 md:grid-cols-12 items-end">
          <div className="space-y-2 md:col-span-6">
            <Label>Nama Peralatan</Label>
            <Select
              value={peralatanOptions.includes(peralatan.nama) ? peralatan.nama : "custom"}
              onValueChange={(value) => updatePeralatan(peralatan.id, "nama", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih peralatan" />
              </SelectTrigger>
              <SelectContent>
                {peralatanOptions.map((nama) => (
                  <SelectItem key={nama} value={nama}>
                    {nama}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Lainnya</SelectItem>
              </SelectContent>
            </Select>
            {peralatan.nama === "custom" ? (
              <Input
                type="text"
                placeholder="Masukkan nama peralatan manual"
                value={peralatanCustomInputs[peralatan.id] || ""}
                onChange={(e) => updatePeralatanCustomInput(peralatan.id, e.target.value)}
                className="mt-2 w-full"
              />
            ) : null}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Jumlah</Label>
            <Input
              type="number"
              min="1"
              value={peralatan.jumlah}
              onChange={(e) => updatePeralatan(peralatan.id, "jumlah", parseInt(e.target.value) || 1)}
              className="w-full"
            />
          </div>
          {/* Satuan (Conditional visibility) */}
          {reportType !== "tersier" && (
            <div className="space-y-2 md:col-span-2">
              <Label>Satuan</Label>
              <Select
                value={peralatan.satuan}
                onValueChange={(value) => updatePeralatan(peralatan.id, "satuan", value)}
              >
                <SelectTrigger className="w-full">
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
          )}
          <div className="md:col-span-2 flex justify-end">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => removePeralatan(peralatan.id)}
              disabled={currentKegiatan.peralatans.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={addPeralatan}>
          <Plus className="h-4 w-4 mr-1" />
          Tambah Peralatan
        </Button>
      </div>
    </div>
  );
};