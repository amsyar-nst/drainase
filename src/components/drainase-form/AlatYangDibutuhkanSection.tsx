import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { KegiatanDrainase, Alat } from "@/types/laporan";
import { alatOptions } from "@/data/kecamatan-kelurahan";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"; 

interface AlatYangDibutuhkanSectionProps {
  currentKegiatan: KegiatanDrainase;
  updateCurrentKegiatan: (updates: Partial<KegiatanDrainase>) => void;
}

export const AlatYangDibutuhkanSection: React.FC<AlatYangDibutuhkanSectionProps> = ({
  currentKegiatan,
  updateCurrentKegiatan,
}) => {
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const addAlat = () => {
    const newAlat: Alat = {
      id: Date.now().toString(),
      nama: "",
      jumlah: 1,
    };
    updateCurrentKegiatan({
      alatYangDibutuhkan: [...(currentKegiatan.alatYangDibutuhkan || []), newAlat],
    });
  };

  const removeAlat = (id: string) => {
    if (currentKegiatan.alatYangDibutuhkan && currentKegiatan.alatYangDibutuhkan.length > 1) {
      updateCurrentKegiatan({
        alatYangDibutuhkan: currentKegiatan.alatYangDibutuhkan.filter((a) => a.id !== id),
      });
      if (openPopoverId === id) {
        setOpenPopoverId(null);
      }
    }
  };

  const updateAlat = (id: string, field: keyof Alat, value: string | number) => {
    updateCurrentKegiatan({
      alatYangDibutuhkan: (currentKegiatan.alatYangDibutuhkan || []).map((a) =>
        a.id === id ? { ...a, [field]: value } : a
      ),
    });
  };

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <Label className="font-semibold text-lg">Alat yang Dibutuhkan (Opsional)</Label>
      {(currentKegiatan.alatYangDibutuhkan || []).map((alat) => (
        <div key={alat.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-b pb-4 last:border-b-0 last:pb-0">
          {/* Nama Alat */}
          <div className="space-y-2 md:col-span-2">
            <Label>Nama Alat</Label>
            <Popover
              open={openPopoverId === alat.id}
              onOpenChange={(isOpen) => setOpenPopoverId(isOpen ? alat.id : null)}
            >
              <PopoverTrigger asChild>
                <Input
                  type="text"
                  placeholder="Pilih atau ketik"
                  value={alat.nama}
                  onChange={(e) => {
                    updateAlat(alat.id, "nama", e.target.value);
                  }}
                />
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
                <Command>
                  <CommandList>
                    <CommandEmpty>Tidak ditemukan. Anda dapat mengetik jenis alat baru.</CommandEmpty>
                    <CommandGroup>
                      {alatOptions
                        .filter((nama) =>
                          nama.toLowerCase().includes(alat.nama.toLowerCase())
                        )
                        .map((nama) => (
                          <CommandItem
                            key={nama}
                            onSelect={() => {
                              updateAlat(alat.id, "nama", nama);
                              setOpenPopoverId(null);
                            }}
                          >
                            {nama}
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
              placeholder="1"
              value={alat.jumlah}
              onChange={(e) => updateAlat(alat.id, "jumlah", parseInt(e.target.value) || 1)}
            />
          </div>
          {/* Remove Button */}
          <div className="md:col-span-1 flex justify-end">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => removeAlat(alat.id)}
              disabled={(currentKegiatan.alatYangDibutuhkan || []).length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={addAlat}>
          <Plus className="h-4 w-4 mr-1" />
          Tambah Alat
        </Button>
      </div>
    </div>
  );
};