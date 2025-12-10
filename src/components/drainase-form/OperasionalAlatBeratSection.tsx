import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, List } from "lucide-react"; // Added List icon
import { KegiatanDrainase, OperasionalAlatBerat } from "@/types/laporan";
import { alatBeratOptions } from "@/data/kecamatan-kelurahan";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList, CommandInput } from "@/components/ui/command"; // Added CommandInput
import { Textarea } from "@/components/ui/textarea";

interface OperasionalAlatBeratSectionProps {
  currentKegiatan: KegiatanDrainase;
  updateCurrentKegiatan: (updates: Partial<KegiatanDrainase>) => void;
}

export const OperasionalAlatBeratSection: React.FC<OperasionalAlatBeratSectionProps> = ({
  currentKegiatan,
  updateCurrentKegiatan,
}) => {
  // State to control which popover is open
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  // State to manage search terms for each operasional item
  const [operasionalSearchTerms, setOperasionalSearchTerms] = useState<Record<string, string>>({});

  const handleOperasionalSearchChange = (operasionalId: string, value: string) => {
    setOperasionalSearchTerms(prev => ({ ...prev, [operasionalId]: value }));
  };

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
      if (openPopoverId === id) {
        setOpenPopoverId(null);
      }
      setOperasionalSearchTerms(prev => {
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

  return (
    <div className="space-y-4">
      <Label>Operasional Alat Berat</Label> {/* Label remains at the top */}
      {currentKegiatan.operasionalAlatBerats.map((operasional) => (
        <div key={operasional.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border-b pb-4 last:border-b-0 last:pb-0">
          {/* Jenis Alat Berat */}
          <div className="space-y-2 md:col-span-3">
            <Label>Jenis Alat Berat</Label>
            <Popover
              open={openPopoverId === operasional.id}
              onOpenChange={(isOpen) => {
                setOpenPopoverId(isOpen ? operasional.id : null);
                if (isOpen) {
                  setOperasionalSearchTerms(prev => ({ ...prev, [operasional.id]: operasional.jenis }));
                } else {
                  const currentSearchTerm = operasionalSearchTerms[operasional.id];
                  if (currentSearchTerm !== undefined && currentSearchTerm !== operasional.jenis) {
                    updateOperasionalAlatBerat(operasional.id, "jenis", currentSearchTerm);
                  }
                  setOperasionalSearchTerms(prev => {
                    const newState = { ...prev };
                    delete newState[operasional.id];
                    return newState;
                  });
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openPopoverId === operasional.id}
                  className="w-full justify-between"
                >
                  {operasional.jenis || "Pilih atau ketik jenis alat berat..."}
                  <List className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
                <Command>
                  <CommandInput
                    placeholder="Cari jenis alat berat..."
                    value={operasionalSearchTerms[operasional.id] || ""}
                    onValueChange={(value) => handleOperasionalSearchChange(operasional.id, value)}
                  />
                  <CommandList>
                    <CommandEmpty>Tidak ditemukan. Anda dapat mengetik jenis alat berat baru.</CommandEmpty>
                    <CommandGroup>
                      {alatBeratOptions
                        .filter((jenis) =>
                          jenis.toLowerCase().includes((operasionalSearchTerms[operasional.id] || "").toLowerCase())
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
              type="text" // Changed to text
              placeholder="0"
              value={operasional.jumlah === 0 ? "" : operasional.jumlah.toString()} // Display empty if 0
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  updateOperasionalAlatBerat(operasional.id, "jumlah", 0); // Save as 0 if empty
                } else if (/^\d{0,2}$/.test(value)) { // Allow 0 to 2 digits
                  updateOperasionalAlatBerat(operasional.id, "jumlah", parseInt(value, 10));
                }
              }}
              maxLength={2} // Add maxLength attribute
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
      <div className="flex justify-end"> {/* Moved button here */}
        <Button type="button" variant="outline" size="sm" onClick={addOperasionalAlatBerat}>
          <Plus className="h-4 w-4 mr-1" />
          Tambah Operasional Alat Berat
        </Button>
      </div>
    </div>
  );
};