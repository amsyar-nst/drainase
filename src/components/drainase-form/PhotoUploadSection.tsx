import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { KegiatanDrainase } from "@/types/laporan";

interface PhotoUploadSectionProps {
  currentKegiatan: KegiatanDrainase;
  updateCurrentKegiatan: (updates: Partial<KegiatanDrainase>) => void;
  setShowPreview: (show: boolean) => void;
  setPreviewUrl: (url: string | null) => void;
}

export const PhotoUploadSection: React.FC<PhotoUploadSectionProps> = ({
  currentKegiatan,
  updateCurrentKegiatan,
  setShowPreview,
  setPreviewUrl,
}) => {
  const handleImageClick = (file: File | string | null, url?: string) => {
    if (file instanceof File) {
      setPreviewUrl(URL.createObjectURL(file));
    } else if (url) {
      setPreviewUrl(url);
    }
    setShowPreview(true);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="foto-0">Foto 0%</Label>
        <Input
          id="foto-0"
          type="file"
          accept="image/*"
          onChange={(e) => updateCurrentKegiatan({ foto0: e.target.files?.[0] || null })}
        />
        {(currentKegiatan.foto0 || currentKegiatan.foto0Url) && (
          <div className="mt-2">
            <img
              src={
                currentKegiatan.foto0 instanceof File
                  ? URL.createObjectURL(currentKegiatan.foto0)
                  : currentKegiatan.foto0Url || ''
              }
              alt="Foto 0%"
              className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
              onClick={() => handleImageClick(currentKegiatan.foto0, currentKegiatan.foto0Url)}
            />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="foto-50">Foto 50%</Label>
        <Input
          id="foto-50"
          type="file"
          accept="image/*"
          onChange={(e) => updateCurrentKegiatan({ foto50: e.target.files?.[0] || null })}
        />
        {(currentKegiatan.foto50 || currentKegiatan.foto50Url) && (
          <div className="mt-2">
            <img
              src={
                currentKegiatan.foto50 instanceof File
                  ? URL.createObjectURL(currentKegiatan.foto50)
                  : currentKegiatan.foto50Url || ''
              }
              alt="Foto 50%"
              className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
              onClick={() => handleImageClick(currentKegiatan.foto50, currentKegiatan.foto50Url)}
            />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="foto-100">Foto 100%</Label>
        <Input
          id="foto-100"
          type="file"
          accept="image/*"
          onChange={(e) => updateCurrentKegiatan({ foto100: e.target.files?.[0] || null })}
        />
        {(currentKegiatan.foto100 || currentKegiatan.foto100Url) && (
          <div className="mt-2">
            <img
              src={
                currentKegiatan.foto100 instanceof File
                  ? URL.createObjectURL(currentKegiatan.foto100)
                  : currentKegiatan.foto100Url || ''
              }
              alt="Foto 100%"
              className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
              onClick={() => handleImageClick(currentKegiatan.foto100, currentKegiatan.foto100Url)}
            />
          </div>
        )}
      </div>
    </div>
  );
};