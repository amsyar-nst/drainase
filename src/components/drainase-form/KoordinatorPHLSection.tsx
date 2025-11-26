import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KegiatanDrainase } from "@/types/laporan";
import { koordinatorOptions } from "@/data/kecamatan-kelurahan";

interface KoordinatorPHLSectionProps {
  currentKegiatan: KegiatanDrainase;
  updateCurrentKegiatan: (updates: Partial<KegiatanDrainase>) => void;
}

export const KoordinatorPHLSection: React.FC<KoordinatorPHLSectionProps> = ({
  currentKegiatan,
  updateCurrentKegiatan,
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="koordinator">Koordinator</Label>
        <Select
          value={currentKegiatan.koordinator}
          onValueChange={(value) => updateCurrentKegiatan({ koordinator: value })}
        >
          <SelectTrigger id="koordinator">
            <SelectValue placeholder="Pilih koordinator" />
          </SelectTrigger>
          <SelectContent>
            {koordinatorOptions.map((koordinator) => (
              <SelectItem key={koordinator} value={koordinator}>
                {koordinator}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="jumlah-phl">Jumlah PHL</Label>
        <Input
          id="jumlah-phl"
          type="number"
          min="1"
          value={currentKegiatan.jumlahPHL}
          onChange={(e) => updateCurrentKegiatan({ jumlahPHL: parseInt(e.target.value) || 1 })}
        />
      </div>
    </div>
  );
};