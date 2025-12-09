import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { KegiatanDrainase, Alat } from "@/types/laporan"; // Changed import to KegiatanDrainase
import { alatOptions } from "@/data/kecamatan-kelurahan";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

interface AlatYangDibutuhkanSectionProps {
  currentKegiatan: KegiatanDrainase; // Changed type to KegiatanDrainase
  updateCurrentKegiatan: (updates: Partial<KegiatanDrainase>) => void;
}

export const AlatYangDibutuhkanSection: React.FC<AlatYangDibutuhkanSectionProps> = ({
  currentKegiatan,
  updateCurrentKegiatan,
}) => {
  const [newAlatName, setNewAlatName] = useState("");
  const [openPopover, setOpenPopover] = useState(false);

  const addAlat = (name: string) => {
    if (name.trim() === "") return;

    // Ensure alatYangDibutuhkan is initialized as an array
    const currentAlatYangDibutuhkan = currentKegiatan.alatYangDibutuhkan || [];

    const existingAlat = currentAlatYangDibutuhkan.find(
      (alat) => alat.nama.toLowerCase() === name.toLowerCase()
    );

    if (existingAlat) {
      updateAlat(existingAlat.id, "jumlah", existingAlat.jumlah + 1);
      setNewAlatName("");
      setOpenPopover(false);
      return;
    }

    const newAlat: Alat = {
      id: crypto.randomUUID(), // Use crypto.randomUUID() for unique IDs
      nama: name,
      jumlah: 1,
    };
    updateCurrentKegiatan({
      alatYangDibutuhkan: [...currentAlatYangDibutuhkan, newAlat],
    });
    setNewAlatName("");
    setOpenPopover(false);
  };

  const removeAlat = (id: string) => {
    const currentAlatYangDibutuhkan = currentKegiatan.alatYangDibutuhkan || [];
    updateCurrentKegiatan({
      alatYangDibutuhkan: currentAlatYangDibutuhkan.filter((alat) => alat.id !== id),
    });
  };

  const updateAlat = (id: string, field: keyof Alat, value: string | number) => {
    const currentAlatYangDibutuhkan = currentKegiatan.alatYangDibutuhkan || [];
    updateCurrentKegiatan({
      alatYangDibutuhkan: currentAlatYangDibutuhkan.map((alat) =>
        alat.id === id ? { ...alat, [field]: value } : alat
      ),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Alat yang Dibutuhkan</Label>
        <Popover open={openPopover} onOpenChange={setOpenPopover}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openPopover}
              className="w-[200px] justify-between"
            >
              {newAlatName ? newAlatName : "Tambah alat..."}
              <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandList>
                <CommandEmpty>Tidak ditemukan. Anda dapat mengetik alat baru.</CommandEmpty>
                <CommandGroup>
                  <Input
                    placeholder="Cari atau ketik alat..."
                    value={newAlatName}
                    onChange={(e) => setNewAlatName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newAlatName.trim() !== "") {
                        e.preventDefault(); // Prevent form submission
                        addAlat(newAlatName);
                      }
                    }}
                    className="h-9"
                  />
                  {alatOptions
                    .filter((alat) =>
                      alat.toLowerCase().includes(newAlatName.toLowerCase())
                    )
                    .map((alat) => (
                      <CommandItem
                        key={alat}
                        onSelect={() => addAlat(alat)}
                      >
                        {alat}
                      </CommandItem>
                    ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {(currentKegiatan.alatYangDibutuhkan || []).length === 0 ? (
        <p className="text-muted-foreground text-sm">Belum ada alat yang ditambahkan.</p>
      ) : (
        <div className="space-y-3">
          {(currentKegiatan.alatYangDibutuhkan || []).map((alat) => (
            <div key={alat.id} className="flex items-center gap-2">
              <Input
                value={alat.nama}
                onChange={(e) => updateAlat(alat.id, "nama", e.target.value)}
                placeholder="Nama alat"
                className="flex-1"
              />
              <Input
                type="number"
                min="1"
                value={alat.jumlah}
                onChange={(e) => updateAlat(alat.id, "jumlah", parseInt(e.target.value) || 1)}
                className="w-20"
              />
              <Button
                variant="destructive"
                size="icon"
                onClick={() => removeAlat(alat.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};