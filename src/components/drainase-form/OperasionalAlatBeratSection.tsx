import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { KegiatanDrainase, OperasionalAlatBerat } from "@/types/laporan";
import { alatBeratOptions } from "@/data/kecamatan-kelurahan";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface OperasionalAlatBeratSectionProps {
  currentKegiatan: KegiatanDrainase;
  updateCurrentKegiatan: (updates: Partial<KegiatanDrainase>) => void;
}

export const OperasionalAlatBeratSection: React.FC<OperasionalAlatBeratSectionProps> = ({
  currentKegiatan,
  updateCurrentKegiatan,
}) => {
  const [openPopover, setOpenPopover] = useState<Record<string, boolean>>({});

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
      setOpenPopover(prev => {
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

  const handleJenisInputChange = (id: string, value: string) => {
    updateOperasionalAlatBerat(id, "jenis", value);
    setOpenPopover(prev => ({ ...prev, [id]: true })); // Open popover on input change
  };

  const handleSelectJenis = (id: string, selectedJenis: string) => {
    updateOperasionalAlatBerat(id, "jenis", selectedJenis);
    setOpenPopover(prev => ({ ...prev, [id]: false })); // Close popover on selection
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
            <Popover open={openPopover[operasional.id]} onOpenChange={(open) => setOpenPopover(prev => ({ ...prev, [operasional.id]: open }))}>
              <PopoverTrigger asChild>
                <Input
                  type="text"
                  placeholder="Pilih atau masukkan jenis alat berat"
                  value={operasional.jenis}
                  onChange={(e) => handleJenisInputChange(operasional.id, e.target.value)}
                  onFocus={() => setOpenPopover(prev => ({ ...prev, [operasional.id]: true }))}
                />
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50">
                <Command>
                  <CommandInput placeholder="Cari jenis alat berat..." value={operasional.jenis} onValueChange={(value) => handleJenisInputChange(operasional.id, value)} />
                  <CommandList>
                    <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {alatBeratOptions
                        .filter(
                          (jenis) =>
                            operasional.jenis === "" ||
                            jenis.toLowerCase().includes(operasional.jenis.toLowerCase())
                        )
                        .map((jenis) => (
                          <CommandItem
                            key={jenis}
                            value={jenis}
                            onSelect={() => handleSelectJenis(operasional.id, jenis)}
                            className={cn(
                              "cursor-pointer",
                              operasional.jenis === jenis && "bg-accent text-accent-foreground"
                            )}
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
      ))}
    </div>
  );
};