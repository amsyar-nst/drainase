import React, { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { KegiatanDrainase, Peralatan } from "@/types/laporan";
import { peralatanOptions, satuanOptions } from "@/data/kecamatan-kelurahan";
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
}

export const PeralatanSection: React.FC<PeralatanSectionProps> = ({
  currentKegiatan,
  updateCurrentKegiatan,
  peralatanCustomInputs,
  setPeralatanCustomInputs,
}) => {

  useEffect(() => {
    const initialPeralatanCustomInputs: Record<string, string> = {};
    currentKegiatan.peralatans.forEach(p => {
      if (!peralatanOptions.includes(p.nama) && p.nama !== "") {
        initialPeralatanCustomInputs[p.id] = p.nama;
        p.nama = "custom"; 
      }
    });
    setPeralatanCustomInputs(initialPeralatanCustomInputs);
  }, [currentKegiatan.peralatans, setPeralatanCustomInputs]);

  const addPeralatan = () => {
    const newPeralatan: Peralatan = {
      id: Date.now().toString(),
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
              updatedPeralatan.nama = "custom";
              setPeralatanCustomInputs((prev) => ({ ...prev, [id]: "" }));
            } else {
              setPeralatanCustomInputs((prev) => {
                const newInputs = { ...prev };
                delete newInputs[id];
                return newInputs;
              });
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
    updateCurrentKegiatan({
      peralatans: currentKegiatan.peralatans.map((p) =>
        p.id === id ? { ...p, nama: value } : p
      ),
    });
  };

  return (
    <div className="space-y-4">
      <Label>Peralatan yang Digunakan</Label>
      {currentKegiatan.peralatans.map((peralatan) => (
        <div key={peralatan.id} className="grid gap-4 md:grid-cols-4 items-end border-b pb-4 last:border-b-0 last:pb-0">
          <div className="space-y-2 md:col-span-2">
            <Label>Nama Peralatan</Label>
            <Select
              value={peralatanOptions.includes(peralatan.nama) ? peralatan.nama : "custom"}
              onValueChange={(value) => updatePeralatan(peralatan.id, "nama", value)}
            >
              <SelectTrigger>
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
                className="mt-2"
              />
            ) : null}
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
          <div className="space-y-2">
            <Label>Satuan</Label>
            <Select
              value={peralatan.satuan}
              onValueChange={(value) => updatePeralatan(peralatan.id, "satuan", value)}
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
            onClick={() => removePeralatan(peralatan.id)}
            disabled={currentKegiatan.peralatans.length === 1}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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