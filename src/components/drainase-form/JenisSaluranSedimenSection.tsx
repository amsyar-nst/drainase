import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KegiatanDrainase } from "@/types/laporan";

interface JenisSaluranSedimenSectionProps {
  currentKegiatan: KegiatanDrainase;
  updateCurrentKegiatan: (updates: Partial<KegiatanDrainase>) => void;
}

export const JenisSaluranSedimenSection: React.FC<JenisSaluranSedimenSectionProps> = ({
  currentKegiatan,
  updateCurrentKegiatan,
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="jenis-saluran">Jenis Saluran</Label>
        <Select
          value={currentKegiatan.jenisSaluran}
          onValueChange={(value) => updateCurrentKegiatan({ jenisSaluran: value as "Terbuka" | "Tertutup" | "" })}
        >
          <SelectTrigger id="jenis-saluran">
            <SelectValue placeholder="Pilih jenis saluran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Terbuka">Terbuka</SelectItem>
            <SelectItem value="Tertutup">Tertutup</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="jenis-sedimen">Jenis Sedimen</Label>
        <Select
          value={currentKegiatan.jenisSedimen}
          onValueChange={(value) => updateCurrentKegiatan({ jenisSedimen: value as "Padat" | "Cair" | "Padat & Cair" | "" })}
        >
          <SelectTrigger id="jenis-sedimen">
            <SelectValue placeholder="Pilih jenis sedimen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Padat">Padat</SelectItem>
            <SelectItem value="Cair">Cair</SelectItem>
            <SelectItem value="Padat & Cair">Padat & Cair</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};