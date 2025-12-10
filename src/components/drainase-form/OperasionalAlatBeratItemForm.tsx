import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList, CommandInput } from "@/components/ui/command";
import { List, Trash2 } from "lucide-react";
import { OperasionalAlatBerat } from "@/types/laporan";
import { alatBeratOptions } from "@/data/kecamatan-kelurahan";

interface OperasionalAlatBeratItemFormProps {
  operasional: OperasionalAlatBerat;
  updateOperasionalAlatBerat: (id: string, field: keyof OperasionalAlatBerat, value: string | number) => void;
  removeOperasionalAlatBerat: (id: string) => void;
  isRemoveDisabled: boolean;
}

export const OperasionalAlatBeratItemForm: React.FC<OperasionalAlatBeratItemFormProps> = ({
  operasional,
  updateOperasionalAlatBerat,
  removeOperasionalAlatBerat,
  isRemoveDisabled,
}) => {
  const [openPopover, setOpenPopover] = useState(false);
  const [operasionalSearch, setOperasionalSearch] = useState(operasional.jenis);

  useEffect(() => {
    if (!openPopover) {
      // When popover closes, commit the search term to the operasional.jenis if it's different
      if (operasionalSearch !== operasional.jenis) {
        updateOperasionalAlatBerat(operasional.id, "jenis", operasionalSearch);
      }
    } else {
      // When popover opens, sync search term with current operasional.jenis
      setOperasionalSearch(operasional.jenis);
    }
  }, [openPopover, operasional.jenis]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border-b pb-4 last:border-b-0 last:pb-0">
      {/* Jenis Alat Berat */}
      <div className="space-y-2 md:col-span-3">
        <Label>Jenis Alat Berat</Label>
        <Popover open={openPopover} onOpenChange={setOpenPopover}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openPopover}
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
                value={operasionalSearch}
                onValueChange={setOperasionalSearch}
              />
              <CommandList>
                <CommandEmpty>Tidak ditemukan. Anda dapat mengetik jenis alat berat baru.</CommandEmpty>
                <CommandGroup>
                  {alatBeratOptions
                    .filter((jenis) =>
                      jenis.toLowerCase().includes(operasionalSearch.toLowerCase())
                    )
                    .map((jenis) => (
                      <CommandItem
                        key={jenis}
                        onSelect={() => {
                          updateOperasionalAlatBerat(operasional.id, "jenis", jenis);
                          setOpenPopover(false);
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
          type="text"
          placeholder="0"
          value={operasional.jumlah === 0 ? "" : operasional.jumlah.toString()}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "") {
              updateOperasionalAlatBerat(operasional.id, "jumlah", 0);
            } else if (/^\d{0,2}$/.test(value)) {
              updateOperasionalAlatBerat(operasional.id, "jumlah", parseInt(value, 10));
            }
          }}
          maxLength={2}
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
          disabled={isRemoveDisabled}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};