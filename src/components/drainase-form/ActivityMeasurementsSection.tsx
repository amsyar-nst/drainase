import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { KegiatanDrainase } from "@/types/laporan";

interface ActivityMeasurementsSectionProps {
  currentKegiatan: KegiatanDrainase;
  updateCurrentKegiatan: (updates: Partial<KegiatanDrainase>) => void;
}

export const ActivityMeasurementsSection: React.FC<ActivityMeasurementsSectionProps> = ({
  currentKegiatan,
  updateCurrentKegiatan,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="aktifitas">Aktifitas Penanganan</Label>
        <Input
          id="aktifitas"
          value={currentKegiatan.aktifitasPenanganan}
          onChange={(e) => updateCurrentKegiatan({ aktifitasPenanganan: e.target.value })}
          placeholder="Contoh: Pembersihan dan Pengerukan"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="panjang">Panjang Penanganan (M)</Label>
          <Input
            id="panjang"
            value={currentKegiatan.panjangPenanganan}
            onChange={(e) => updateCurrentKegiatan({ panjangPenanganan: e.target.value, isVolumeGalianManuallySet: false })}
            placeholder="0"
            type="number" // Use type number for better input experience
            step="0.01" // Allow decimal inputs
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lebar">Lebar Rata-rata (M)</Label>
          <Input
            id="lebar"
            value={currentKegiatan.lebarRataRata}
            onChange={(e) => updateCurrentKegiatan({ lebarRataRata: e.target.value, isVolumeGalianManuallySet: false })}
            placeholder="0"
            type="number" // Use type number for better input experience
            step="0.01" // Allow decimal inputs
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sedimen">Tinggi Rata-rata Sedimen (M)</Label>
          <Input
            id="sedimen"
            value={currentKegiatan.rataRataSedimen}
            onChange={(e) => updateCurrentKegiatan({ rataRataSedimen: e.target.value, isVolumeGalianManuallySet: false })}
            placeholder="0"
            type="number" // Use type number for better input experience
            step="0.01" // Allow decimal inputs
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="volume">Volume Galian (M³)</Label>
          <Input
            id="volume"
            value={currentKegiatan.volumeGalian}
            onChange={(e) => updateCurrentKegiatan({ volumeGalian: e.target.value, isVolumeGalianManuallySet: true })}
            placeholder="0.00"
            type="number" // Use type number for better input experience
            step="0.01" // Allow decimal inputs
          />
        </div>
      </div>
    </div>
  );
};