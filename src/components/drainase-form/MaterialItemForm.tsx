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
import { Material } from "@/types/laporan";
import { materialOptions, satuanOptions, materialDefaultUnits } from "@/data/kecamatan-kelurahan";

interface MaterialItemFormProps {
  material: Material;
  updateMaterial: (id: string, field: keyof Material, value: string) => void;
  removeMaterial: (id: string) => void;
  isRemoveDisabled: boolean;
}

export const MaterialItemForm: React.FC<MaterialItemFormProps> = ({
  material,
  updateMaterial,
  removeMaterial,
  isRemoveDisabled,
}) => {
  const [openPopover, setOpenPopover] = useState(false);
  const [materialSearch, setMaterialSearch] = useState(material.jenis);

  useEffect(() => {
    if (!openPopover) {
      // When popover closes, commit the search term to the material.jenis if it's different
      if (materialSearch !== material.jenis) {
        updateMaterial(material.id, "jenis", materialSearch);
      }
    } else {
      // When popover opens, sync search term with current material.jenis
      setMaterialSearch(material.jenis);
    }
  }, [openPopover, material.jenis]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="grid gap-4 md:grid-cols-5 items-end">
      <div className="space-y-2">
        <Label>Jenis Material</Label>
        <Popover open={openPopover} onOpenChange={setOpenPopover}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openPopover}
              className="w-full justify-between"
            >
              {material.jenis || "Pilih atau ketik material..."}
              <List className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
            <Command>
              <CommandInput
                placeholder="Cari material..."
                value={materialSearch}
                onValueChange={setMaterialSearch}
              />
              <CommandList>
                <CommandEmpty>Tidak ditemukan. Anda dapat mengetik jenis material baru.</CommandEmpty>
                <CommandGroup>
                  {materialOptions
                    .filter((jenis) =>
                      jenis.toLowerCase().includes(materialSearch.toLowerCase())
                    )
                    .map((jenis) => (
                      <CommandItem
                        key={jenis}
                        onSelect={() => {
                          updateMaterial(material.id, "jenis", jenis);
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
      <div className="space-y-2">
        <Label>Jumlah</Label>
        <Input
          value={material.jumlah}
          onChange={(e) => updateMaterial(material.id, "jumlah", e.target.value)}
          placeholder="0"
        />
      </div>
      <div className="space-y-2">
        <Label>Satuan</Label>
        <Select
          value={material.satuan}
          onValueChange={(value) => updateMaterial(material.id, "satuan", value)}
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
      <div className="space-y-2">
        <Label>Keterangan</Label>
        <Input
          value={material.keterangan || ""}
          onChange={(e) => updateMaterial(material.id, "keterangan", e.target.value)}
          placeholder="Catatan material (opsional)"
        />
      </div>
      <Button
        type="button"
        variant="destructive"
        size="icon"
        onClick={() => removeMaterial(material.id)}
        disabled={isRemoveDisabled}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};