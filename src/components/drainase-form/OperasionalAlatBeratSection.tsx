import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { KegiatanDrainase, OperasionalAlatBerat } from "@/types/laporan";
import { alatBeratOptions } from "@/data/kecamatan-kelurahan";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList, CommandInput } from "@/components/ui/command"; // Import CommandInput
import { Textarea } from "@/components/ui/textarea";

interface OperasionalAlatBeratSectionProps {
  currentKegiatan: KegiatanDrainase;
  updateCurrentKegiatan: (updates: Partial<KegiatanDrainase>) => void;
}

export const OperasionalAlatBeratSection: React.FC<OperasionalAlatBeratSectionProps> = ({
  currentKegiatan,
  updateCurrentKegiatan,
}) => {
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const addOperasionalAlatBerat = () => {
    const newOperasional: OperasionalAlatBerat = {
      id: Date.now().toString(),
      jenis: "",
      jumlah: 1,
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
      if (openPopoverId === id) {
        setOpenPopoverId(null);
      }
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
        <div key={operasional.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border-b pb-4 last:border-b-0 last:pb-0">
          {/* Jenis Alat Berat */}
          <div className="space-y-2 md:col-span-3">
            <Label>Jenis Alat Berat</Label>
            <Popover
              open={openPopoverId === operasional.id}
              onOpenChange={(isOpen) => setOpenPopoverId(isOpen ? operasional.id : null)}
            >
              <PopoverTrigger asChild>
                <Input
                  type="text"
                  placeholder="Pilih atau ketik"
                  value={operasional.jenis}
                  onChange={(e) => {
                    updateOperasionalAlatBerat(operasional.id, "jenis", e.target.value);
                    setOpenPopoverId(operasional.id);
                  }}
                />
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
                <Command>
                  <CommandInput placeholder="Cari jenis alat berat..." /> {/* Added CommandInput */}
                  <CommandList>
                    <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {alatBeratOptions
                        .filter((jenis) =>
                          jenis.toLowerCase().includes(operasional.jenis.toLowerCase())
                        )
                        .map((jenis) => (
                          <CommandItem
                            key={jenis}
                            onSelect={() => {
                              updateOperasionalAlatBerat(operasional.id, "jenis", jenis);
                              setOpenPopoverId(null);
                            }}
                          >
                            {jenis}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          {/* Jumlah */}
          <div className="space-y-2 md:col-span-1">
            <Label>Jumlah</Label>
            <Input
              type="number"
              min="1"
              value={operasional.jumlah}
              onChange={(e) => updateOperasionalAlatBerat(operasional.id, "jumlah", parseInt(e.target.value) || 1)}
            />
          </div>
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
    </div>
  );
};