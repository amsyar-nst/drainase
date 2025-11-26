import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KegiatanDrainase } from "@/types/laporan";
import { kecamatanKelurahanData } from "@/data/kecamatan-kelurahan";

interface KegiatanDetailsSectionProps {
  currentKegiatan: KegiatanDrainase;
  updateCurrentKegiatan: (updates: Partial<KegiatanDrainase>) => void;
  kelurahanOptions: string[];
  handleKecamatanChange: (value: string) => void;
  handleKelurahanChange: (value: string) => void;
}

export const KegiatanDetailsSection: React.FC<KegiatanDetailsSectionProps> = ({
  currentKegiatan,
  updateCurrentKegiatan,
  kelurahanOptions,
  handleKecamatanChange,
  handleKelurahanChange,
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="nama-jalan">Nama Jalan</Label>
        <Input
          id="nama-jalan"
          value={currentKegiatan.namaJalan}
          onChange={(e) => updateCurrentKegiatan({ namaJalan: e.target.value })}
          placeholder="Masukkan nama jalan"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="kecamatan">Kecamatan</Label>
        <Select value={currentKegiatan.kecamatan} onValueChange={handleKecamatanChange}>
          <SelectTrigger id="kecamatan">
            <SelectValue placeholder="Pilih kecamatan" />
          </SelectTrigger>
          <SelectContent>
            {kecamatanKelurahanData.map((item) => (
              <SelectItem key={item.kecamatan} value={item.kecamatan}>
                {item.kecamatan}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="kelurahan">Kelurahan</Label>
        <Select
          value={currentKegiatan.kelurahan}
          onValueChange={handleKelurahanChange}
          disabled={!kelurahanOptions.length}
        >
          <SelectTrigger id="kelurahan">
            <SelectValue placeholder="Pilih kelurahan" />
          </SelectTrigger>
          <SelectContent>
            {kelurahanOptions.map((kel) => (
              <SelectItem key={kel} value={kel}>
                {kel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};