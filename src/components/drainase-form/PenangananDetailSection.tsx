import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, FileText, XCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Material } from "@/types/laporan";
import { materialDefaultUnits, materialOptions, satuanOptions } from "@/data/kecamatan-kelurahan";
import { PenangananDetailFormState } from "@/types/form-types";
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea

interface PenangananDetailSectionProps {
  detail: PenangananDetailFormState;
  index: number;
  updateDetail: (index: number, updates: Partial<PenangananDetailFormState>) => void;
  removeDetail: (index: number) => void;
  isRemovable: boolean;
  reportType: "harian" | "bulanan" | "tersier";
  onPreviewPhoto: (url: string) => void;
}

const predefinedSedimenOptions = [
  "Padat", "Cair", "Padat & Cair", "Batu", "Batu/Padat", "Batu/Cair",
  "Padat & Batu", "Padat/ Gulma & Sampah", "Padat/ Cair/Sampah", "Gulma/Rumput",
  "Batu/ Padat & Cair", "Sampah"
];

export const PenangananDetailSection: React.FC<PenangananDetailSectionProps> = ({
  detail,
  index,
  updateDetail,
  removeDetail,
  isRemovable,
  reportType,
  onPreviewPhoto,
}) => {
  const [isFoto0Dragging, setIsFoto0Dragging] = useState(false);
  const [isFoto50Dragging, setIsFoto50Dragging] = useState(false);
  const [isFoto100Dragging, setIsFoto100Dragging] = useState(false);
  const [isFotoSketDragging, setIsFotoSketDragging] = useState(false);

  useEffect(() => {
    if (detail.jenisSedimen) {
      if (predefinedSedimenOptions.includes(detail.jenisSedimen)) {
        updateDetail(index, { selectedSedimenOption: detail.jenisSedimen, customSedimen: "" });
      } else {
        updateDetail(index, { selectedSedimenOption: "custom", customSedimen: detail.jenisSedimen });
      }
    } else {
      updateDetail(index, { selectedSedimenOption: "", customSedimen: "" });
    }
  }, [detail.jenisSedimen, index, updateDetail]);

  // Helper to process files from drop/paste
  const processAndAddFiles = (files: FileList, field: 'foto0' | 'foto50' | 'foto100' | 'fotoSket') => {
    const newFiles = Array.from(files);
    if (newFiles.length > 0) {
      updateDetail(index, { [field]: [...detail[field], ...newFiles] });
    }
  };

  // Generic drag and paste handlers factory
  const createDragAndPasteHandlers = (setDraggingState: React.Dispatch<React.SetStateAction<boolean>>, field: 'foto0' | 'foto50' | 'foto100' | 'fotoSket') => ({
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDraggingState(true);
    },
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDraggingState(false);
    },
    onDrop: (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDraggingState(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processAndAddFiles(e.dataTransfer.files, field);
        e.dataTransfer.clearData();
      }
    },
    onPaste: (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (e.clipboardData.files && e.clipboardData.files.length > 0) {
        processAndAddFiles(e.clipboardData.files, field);
      }
    }
  });

  const foto0Handlers = createDragAndPasteHandlers(setIsFoto0Dragging, 'foto0');
  const foto50Handlers = createDragAndPasteHandlers(setIsFoto50Dragging, 'foto50');
  const foto100Handlers = createDragAndPasteHandlers(setIsFoto100Dragging, 'foto100');
  const fotoSketHandlers = createDragAndPasteHandlers(setIsFotoSketDragging, 'fotoSket');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'foto0' | 'foto50' | 'foto100' | 'fotoSket') => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      updateDetail(index, { [field]: [...detail[field], ...newFiles] });
    }
  };

  const removePhoto = (field: 'foto0' | 'foto50' | 'foto100' | 'fotoSket', photoIndex: number) => {
    const updatedPhotos = detail[field].filter((_, i) => i !== photoIndex);
    updateDetail(index, { [field]: updatedPhotos });
  };

  const addMaterial = () => {
    const newMaterial: Material = {
      id: "material-" + Date.now().toString(),
      jenis: "",
      jumlah: "",
      satuan: "M³",
      keterangan: "",
    };
    updateDetail(index, { materials: [...detail.materials, newMaterial] });
  };

  const removeMaterial = (materialId: string) => {
    if (detail.materials.length > 1) {
      const newMaterials = detail.materials.filter((m) => m.id !== materialId);
      updateDetail(index, { materials: newMaterials });
    }
  };

  const updateMaterial = (materialId: string, field: keyof Material, value: string) => {
    const newMaterials = detail.materials.map((m) => {
      if (m.id === materialId) {
        const updatedMaterial = { ...m, [field]: value };
        if (field === "jenis") {
          // If a predefined option is selected, set the value directly
          if (materialOptions.includes(value)) {
            const normalizedJenis = value.toLowerCase().trim();
            const defaultUnit = materialDefaultUnits[normalizedJenis];
            updatedMaterial.satuan = defaultUnit || "M³";
          } else if (value === "custom") {
            // If "Lainnya" is selected, set jenis to empty string to show custom input
            updatedMaterial.jenis = ""; 
            updatedMaterial.satuan = "M³"; // Default unit for custom
          }
          // If value is not "custom" and not in predefined options, it means user is typing in custom input
          // In this case, updatedMaterial.jenis already holds the typed value.
        }
        return updatedMaterial;
      }
      return m;
    });
    updateDetail(index, { materials: newMaterials });
  };

  return (
    <div className="space-y-6 border p-4 rounded-lg bg-muted/10">
      {/* Judul dan tombol hapus (Always visible now) */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Aktifitas Penanganan {index + 1}</h3>
        {isRemovable && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => removeDetail(index)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Hapus Aktifitas
          </Button>
        )}
      </div>

      {/* Photos */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Foto 0% */}
        <div className="space-y-2">
          <Label htmlFor={`foto-0-${detail.id}`}>Foto 0%</Label>
          <div
            {...foto0Handlers}
            className={cn(
              "flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md cursor-pointer",
              isFoto0Dragging ? "border-primary bg-primary/10" : "border-muted-foreground/20 hover:border-primary/50"
            )}
          >
            <Input
              id={`foto-0-${detail.id}`}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileChange(e, 'foto0')}
              className="hidden"
            />
            <p className="text-sm text-muted-foreground">Seret & lepas atau klik untuk unggah</p>
            <p className="text-xs text-muted-foreground">Foto 0%</p>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(Array.isArray(detail.foto0) ? detail.foto0 : []).map((photo, photoIndex) => (
              <div key={photoIndex} className="relative group">
                <img
                  src={
                    photo instanceof File
                      ? URL.createObjectURL(photo)
                      : photo || ''
                  }
                  alt={`Foto 0% ${photoIndex + 1}`}
                  className="w-full h-24 object-cover rounded border cursor-pointer"
                  onClick={() => {
                    const url = photo instanceof File
                      ? URL.createObjectURL(photo)
                      : photo || '';
                    onPreviewPhoto(url);
                  }}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePhoto('foto0', photoIndex)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        {/* Foto 50% (Conditional visibility) */}
        {reportType !== "tersier" && (
          <div className="space-y-2">
            <Label htmlFor={`foto-50-${detail.id}`}>Foto 50%</Label>
            <div
              {...foto50Handlers}
              className={cn(
                "flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md cursor-pointer",
                isFoto50Dragging ? "border-primary bg-primary/10" : "border-muted-foreground/20 hover:border-primary/50"
              )}
            >
              <Input
                id={`foto-50-${detail.id}`}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileChange(e, 'foto50')}
                className="hidden"
              />
              <p className="text-sm text-muted-foreground">Seret & lepas atau klik untuk unggah</p>
              <p className="text-xs text-muted-foreground">Foto 50%</p>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(Array.isArray(detail.foto50) ? detail.foto50 : []).map((photo, photoIndex) => (
                <div key={photoIndex} className="relative group">
                  <img
                    src={
                      photo instanceof File
                        ? URL.createObjectURL(photo)
                        : photo || ''
                    }
                    alt={`Foto 50% ${photoIndex + 1}`}
                    className="w-full h-24 object-cover rounded border cursor-pointer"
                    onClick={() => {
                      const url = photo instanceof File
                        ? URL.createObjectURL(photo)
                        : photo || '';
                      onPreviewPhoto(url);
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePhoto('foto50', photoIndex)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Foto 100% */}
        <div className="space-y-2">
          <Label htmlFor={`foto-100-${detail.id}`}>Foto 100%</Label>
          <div
            {...foto100Handlers}
            className={cn(
              "flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md cursor-pointer",
              isFoto100Dragging ? "border-primary bg-primary/10" : "border-muted-foreground/20 hover:border-primary/50"
            )}
          >
            <Input
              id={`foto-100-${detail.id}`}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileChange(e, 'foto100')}
              className="hidden"
            />
            <p className="text-sm text-muted-foreground">Seret & lepas atau klik untuk unggah</p>
            <p className="text-xs text-muted-foreground">Foto 100%</p>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(Array.isArray(detail.foto100) ? detail.foto100 : []).map((photo, photoIndex) => (
              <div key={photoIndex} className="relative group">
                <img
                  src={
                    photo instanceof File
                      ? URL.createObjectURL(photo)
                      : photo || ''
                  }
                  alt={`Foto 100% ${photoIndex + 1}`}
                  className="w-full h-24 object-cover rounded border cursor-pointer"
                  onClick={() => {
                    const url = photo instanceof File
                      ? URL.createObjectURL(photo)
                      : photo || '';
                    onPreviewPhoto(url);
                  }}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePhoto('foto100', photoIndex)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        {/* Foto Sket (Conditional visibility) */}
        {reportType !== "tersier" && (
          <div className="space-y-2">
            <Label htmlFor={`foto-sket-${detail.id}`}>Gambar Sket</Label>
            <div
              {...fotoSketHandlers}
              className={cn(
                "flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md cursor-pointer",
                isFotoSketDragging ? "border-primary bg-primary/10" : "border-muted-foreground/20 hover:border-primary/50"
              )}
            >
              <Input
                id={`foto-sket-${detail.id}`}
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={(e) => handleFileChange(e, 'fotoSket')}
                className="hidden"
              />
              <p className="text-sm text-muted-foreground">Seret & lepas atau klik untuk unggah</p>
              <p className="text-xs text-muted-foreground">Gambar Sket</p>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(Array.isArray(detail.fotoSket) ? detail.fotoSket : []).map((photo, photoIndex) => (
                <div key={photoIndex} className="relative group">
                  {typeof photo === 'string' && photo.endsWith('.pdf') ? (
                    <a
                      href={photo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full h-24 bg-gray-100 rounded border text-blue-600 hover:underline"
                    >
                      <FileText className="h-8 w-8 mr-2" /> PDF {photoIndex + 1}
                    </a>
                  ) : (
                    <img
                      src={
                        photo instanceof File
                          ? URL.createObjectURL(photo)
                          : photo || ''
                      }
                      alt={`Gambar Sket ${photoIndex + 1}`}
                      className="w-full h-24 object-cover rounded border cursor-pointer"
                      onClick={() => {
                        const url = photo instanceof File
                          ? URL.createObjectURL(photo)
                          : photo || '';
                        onPreviewPhoto(url);
                      }}
                    />
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePhoto('fotoSket', photoIndex)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Jenis Saluran & Sedimen */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Jenis Saluran (Conditional visibility) */}
        {reportType !== "tersier" && (
          <div className="space-y-2">
            <Label htmlFor={`jenis-saluran-${detail.id}`}>Jenis Saluran</Label>
            <Select
              value={detail.jenisSaluran}
              onValueChange={(value) => updateDetail(index, { jenisSaluran: value as "Terbuka" | "Tertutup" | "Terbuka & Tertutup" | "" })}
            >
              <SelectTrigger id={`jenis-saluran-${detail.id}`}>
                <SelectValue placeholder="Pilih jenis saluran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Terbuka">Terbuka</SelectItem>
                <SelectItem value="Tertutup">Tertutup</SelectItem>
                <SelectItem value="Terbuka & Tertutup">Terbuka & Tertutup</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-2"> {/* Jenis Sedimen is always visible */}
          <Label htmlFor={`jenis-sedimen-${detail.id}`}>Jenis Sedimen</Label>
          <Select
            value={detail.selectedSedimenOption}
            onValueChange={(value) => {
              updateDetail(index, { selectedSedimenOption: value });
              if (value === "custom") {
                updateDetail(index, { jenisSedimen: detail.customSedimen });
              } else {
                updateDetail(index, { jenisSedimen: value, customSedimen: "" });
              }
            }}
          >
            <SelectTrigger id={`jenis-sedimen-${detail.id}`}>
              <SelectValue placeholder="Pilih jenis sedimen" />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-[200px]"> {/* Added ScrollArea */}
                {predefinedSedimenOptions.map((jenis) => (
                  <SelectItem key={jenis} value={jenis}>
                    {jenis}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Lainnya</SelectItem>
              </ScrollArea>
            </SelectContent>
          </Select>
          {detail.selectedSedimenOption === "custom" && (
            <Input
              type="text"
              placeholder="Masukkan jenis sedimen manual"
              value={detail.customSedimen}
              onChange={(e) => {
                updateDetail(index, { customSedimen: e.target.value, jenisSedimen: e.target.value });
              }}
              className="mt-2"
            />
          )}
        </div>
      </div>

      {/* Aktifitas Penanganan (Conditional visibility) */}
      {reportType !== "tersier" && (
        <div className="space-y-2">
          <Label htmlFor={`aktifitas-${detail.id}`}>Aktifitas Penanganan</Label>
          <Input
            id={`aktifitas-${detail.id}`}
            value={detail.aktifitasPenanganan}
            onChange={(e) => updateDetail(index, { aktifitasPenanganan: e.target.value })}
            placeholder="Contoh: Pembersihan dan Pengerukan"
          />
        </div>
      )}

      {/* Materials (Conditional visibility) */}
      {reportType !== "tersier" && (
        <div className="space-y-4">
          <Label>Material yang Digunakan</Label>
          {detail.materials.map((material) => (
            <div key={material.id} className="grid gap-4 md:grid-cols-5 items-end">
              <div className="space-y-2">
                <Label>Jenis Material</Label>
                <Select
                  value={materialOptions.includes(material.jenis) ? material.jenis : "custom"}
                  onValueChange={(value) => updateMaterial(material.id, "jenis", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih material" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]"> {/* Added ScrollArea */}
                      {materialOptions.map((jenis) => (
                        <SelectItem key={jenis} value={jenis}>
                          {jenis}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Lainnya</SelectItem>
                    </ScrollArea>
                  </SelectContent>
                </Select>
                {!materialOptions.includes(material.jenis) && (
                  <Input
                    type="text"
                    placeholder="Masukkan jenis material manual"
                    value={material.jenis}
                    onChange={(e) => updateMaterial(material.id, "jenis", e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Jumlah</Label>
                <Input
                  value={material.jumlah}
                  onChange={(e) => updateMaterial(material.id, "jumlah", e.target.value)}
                  placeholder="0"
                />
              </div>
              {/* Satuan Material */}
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
                    <ScrollArea className="h-[200px]"> {/* Added ScrollArea */}
                      {satuanOptions.map((satuan) => (
                        <SelectItem key={satuan} value={satuan}>
                          {satuan}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              {/* Keterangan Material */}
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
                disabled={detail.materials.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
              <Plus className="h-4 w-4 mr-1" />
              Tambah Material
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};