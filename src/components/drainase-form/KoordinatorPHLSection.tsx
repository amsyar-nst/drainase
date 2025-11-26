import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
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
  const handleKoordinatorChange = (koordinatorName: string, checked: boolean) => {
    let updatedKoordinator: string[];
    if (checked) {
      updatedKoordinator = [...currentKegiatan.koordinator, koordinatorName];
    } else {
      updatedKoordinator = currentKegiatan.koordinator.filter(
        (name) => name !== koordinatorName
      );
    }
    updateCurrentKegiatan({ koordinator: updatedKoordinator });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="koordinator">Koordinator</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-2 rounded-md">
          {koordinatorOptions.map((koordinator) => (
            <div key={koordinator} className="flex items-center space-x-2">
              <Checkbox
                id={`koordinator-${koordinator}`}
                checked={currentKegiatan.koordinator.includes(koordinator)}
                onCheckedChange={(checked) =>
                  handleKoordinatorChange(koordinator, checked as boolean)
                }
              />
              <Label htmlFor={`koordinator-${koordinator}`} className="text-sm font-normal">
                {koordinator}
              </Label>
            </div>
          ))}
        </div>
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