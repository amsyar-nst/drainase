import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { KegiatanDrainase } from "@/types/laporan";

interface KeteranganSectionProps {
  currentKegiatan: KegiatanDrainase;
  updateCurrentKegiatan: (updates: Partial<KegiatanDrainase>) => void;
}

export const KeteranganSection: React.FC<KeteranganSectionProps> = ({
  currentKegiatan,
  updateCurrentKegiatan,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="keterangan">Keterangan</Label>
      <Textarea
        id="keterangan"
        value={currentKegiatan.keterangan}
        onChange={(e) => updateCurrentKegiatan({ keterangan: e.target.value })}
        placeholder="Catatan tambahan (opsional)"
        rows={4}
      />
    </div>
  );
};