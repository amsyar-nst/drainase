import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { KegiatanDrainase, OperasionalAlatBerat } from "@/types/laporan";
import { alatBeratOptions } from "@/data/kecamatan-kelurahan"; // Removed satuanOptions as it's no longer needed for fuel units
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
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
}

export const OperasionalAlatBeratSection: React.FC<OperasionalAlatBeratSectionProps> = ({
  currentKegiatan,
  updateCurrentKegiatan,
}) => {
  // State to manage which popover is currently open
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const addOperasionalAlatBerat = () => {
    const newOperasional: OperasionalAlatBerat = {
      id: Date.now().toString(),
      jenis: "",
      jumlah: 1,
      dexliteJumlah: "",
      dexliteSatuan: "Liter", // Default to Liter
      pertaliteJumlah: "",
      pertaliteSatuan: "Liter", // Default to Liter
      bioSolarJumlah: "",
      bioSolarSatuan: "Liter", // Default to Liter
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
        <div key={operasional.id} className="border p-4 rounded-md space-y-4">
          <div className="grid gap-4 md:grid-cols-3 items-end">
            <div className="space-y-2 md:col-span-2">
              <Label>Jenis Alat Berat</Label>
              <Popover
                open={openPopoverId === operasional.id}
                onOpenChange={(isOpen) => setOpenPopoverId(isOpen ? operasional.id : null)}
              >
                <PopoverTrigger asChild>
                  <Input
                    type="text"
                    placeholder="Pilih atau ketik jenis alat berat"
                    value={operasional.jenis}
                    onChange={(e) => {
                      updateOperasionalAlatBerat(operasional.id, "jenis", e.target.value);
                      setOpenPopoverId(operasional.id); // Open popover when typing
                    }}
                  />
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
                  <Command>
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
                                setOpenPopoverId(null); // Close popover after selection
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

          {/* Fuel Inputs */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Dexlite Jumlah</Label>
              <Input
                type="text"
                placeholder="Jumlah Dexlite"
                value={operasional.dexliteJumlah}
                onChange={(e) => updateOperasionalAlatBerat(operasional.id, "dexliteJumlah", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Satuan Dexlite</Label>
              <Input
                type="text"
                value="Liter"
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label>Pertalite Jumlah</Label>
              <Input
                type="text"
                placeholder="Jumlah Pertalite"
                value={operasional.pertaliteJumlah}
                onChange={(e) => updateOperasionalAlatBerat(operasional.id, "pertaliteJumlah", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Satuan Pertalite</Label>
              <Input
                type="text"
                value="Liter"
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label>Bio Solar Jumlah</Label>
              <Input
                type="text"
                placeholder="Jumlah Bio Solar"
                value={operasional.bioSolarJumlah}
                onChange={(e) => updateOperasionalAlatBerat(operasional.id, "bioSolarJumlah", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Satuan Bio Solar</Label>
              <Input
                type="text"
                value="Liter"
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          {/* Keterangan */}
          <div className="space-y-2">
            <Label>Keterangan</Label>
            <Textarea
              placeholder="Catatan tambahan untuk operasional alat berat ini"
              value={operasional.keterangan}
              onChange={(e) => updateOperasionalAlatBerat(operasional.id, "keterangan", e.target.value)}
              rows={2}
            />
          </div>
        </div>
      ))}
    </div>
  );
};