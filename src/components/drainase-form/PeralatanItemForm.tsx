import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList, CommandInput } from "@/components/ui/command";
import { List, Trash2 } from "lucide-react";
import { Peralatan } from "@/types/laporan";
import { peralatanOptions, satuanOptions } from "@/data/kecamatan-kelurahan";

interface PeralatanItemFormProps {
  peralatan: Peralatan;
  updatePeralatan: (id: string, field: keyof Peralatan, value: string | number) => void;
  removePeralatan: (id: string) => void;
  isRemoveDisabled: boolean;
}

export const PeralatanItemForm: React.FC<PeralatanItemFormProps> = ({
  peralatan,
  updatePeralatan,
  removePeralatan,
  isRemoveDisabled,
}) => {
  const [openPopover, setOpenPopover] = useState(false);
  const [peralatanSearch, setPeralatanSearch] = useState(peralatan.nama);

  useEffect(() => {
    if (!openPopover) {
      // When popover closes, commit the search term to the peralatan.nama if it's different
      if (peralatanSearch !== peralatan.nama) {
        updatePeralatan(peralatan.id, "nama", peralatanSearch);
      }
    } else {
      // When popover opens, sync search term with current peralatan.nama
      setPeralatanSearch(peralatan.nama);
    }
  }, [openPopover, peralatan.nama]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="grid gap-4 md:grid-cols-4 items-end">
      <div className="space-y-2 md:col-span-2">
        <Label>Nama Peralatan</Label>
        <Popover open={openPopover} onOpenChange={setOpenPopover}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openPopover}
              className="w-full justify-between"
            >
              {peralatan.nama || "Pilih atau ketik peralatan..."}
              <List className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
            <Command>
              <CommandInput
                placeholder="Cari peralatan..."
                value={peralatanSearch}
                onValueChange={setPeralatanSearch}
              />
              <CommandList>
                <CommandEmpty>Tidak ditemukan. Anda dapat mengetik nama peralatan baru.</CommandEmpty>
                <CommandGroup>
                  {peralatanOptions
                    .filter((nama) =>
                      nama.toLowerCase().includes(peralatanSearch.toLowerCase())
                    )
                    .map((nama) => (
                      <CommandItem
                        key={nama}
                        onSelect={() => {
                          updatePeralatan(peralatan.id, "nama", nama);
                          setOpenPopover(false);
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
        disabled={isRemoveDisabled}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};