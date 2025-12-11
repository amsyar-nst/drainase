import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { XCircle, Plus, Trash2, FileText, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Material } from "@/types/laporan";
import { materialOptions, satuanOptions, materialDefaultUnits } from "@/data/kecamatan-kelurahan";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Define predefined sedimen options for easier comparison
const predefinedSedimenOptions = [
  "Padat", "Cair", "Padat & Cair", "Batu", "Batu/Padat", "Batu/Cair",
  "Padat & Batu", "Padat/ Gulma & Sampah", "Padat/ Cair/Sampah", "Gulma/Rumput",
  "Batu/ Padat & Cair", "Sampah"
];

export interface PenangananDetailFormProps {
  detail: {
    id: string;
    foto0: (File | string | null)[];
    foto50: (File | string | null)[];
    foto100: (File | string | null)[];
    fotoSket: (File | string | null)[];
    jenisSaluran: "Terbuka" | "Tertutup" | "Terbuka & Tertutup" | "";
    jenisSedimen: string;
    aktifitasPenanganan: string;
    materials: Material[];
  };
  index: number;
  reportType: "harian" | "bulanan" | "tersier";
  onUpdate: (index: number, updates: Partial<PenangananDetailFormProps['detail']>) => void;
  onRemove: (index: number) => void;
  isRemovable: boolean;
}

export const PenangananDetailForm: React.FC<PenangananDetailFormProps> = ({
  detail,
  index,
  reportType,
  onUpdate,
  onRemove,
  isRemovable,
}) => {
  const [selectedSedimenOption, setSelectedSedimenOption] = useState<string>("");
  const [customSedimen, setCustomSedimen] = useState("");
  const [materialCustomInputs, setMaterialCustomInputs] = useState<Record<string, string>>({});

  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Dragging states for photos
  const [isFoto0Dragging, setIsFoto0Dragging] = useState(false);
  const [isFoto50Dragging, setIsFoto50Dragging] = useState(false);
  const [isFoto100Dragging, setIsFoto100Dragging] = useState(false);
  const [isFotoSketDragging, setIsFotoSketDragging] = useState(false);

  useEffect(() => {
    if (detail.jenisSedimen) {
      if (predefinedSedimenOptions.includes(detail.jenisSedimen)) {
        setSelectedSedimenOption(detail.jenisSedimen);
        setCustomSedimen("");
      } else {
        setSelectedSedimenOption("custom");
        setCustomSedimen(detail.jenisSedimen);
      }
    } else {
      setSelectedSedimenOption("");
      setCustomSedimen("");
    }
  }, [detail.jenisSedimen]);

  useEffect(() => {
    const initialMaterialCustomInputs: Record<string, string> = {};
    detail.materials.forEach(m => {
      if (!materialOptions.includes(m.jenis) && m.jenis !== "") {
        initialMaterialCustomInputs[m.id] = m.jenis;
      }
    });
    setMaterialCustomInputs(initialMaterialCustomInputs);
  }, [detail.materials]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'foto0' | 'foto50' | 'foto100' | 'fotoSket') => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      onUpdate(index, { [field]: [...detail[field], ...newFiles] });
    }
  };

  const removePhoto = (field: 'foto0' | 'foto50' | 'foto100' | 'fotoSket', photoIndex: number) => {
    const updatedPhotos = detail[field].filter((_, i) => i !== photoIndex);
    onUpdate(index, { [field]: updatedPhotos });
  };

  const addMaterial = () => {
    const newMaterial: Material = {
      id: "material-" + Date.now().toString(),
      jenis: "",
      jumlah: "",
      satuan: "M³",
      keterangan: "",
    };
    onUpdate(index, { materials: [...detail.materials, newMaterial] });
  };

  const removeMaterial = (materialId: string) => {
    if (detail.materials.length > 1) {
      onUpdate(index, { materials: detail.materials.filter((m) => m.id !== materialId) });
      setMaterialCustomInputs((prev) => {
        const newInputs = { ...prev };
        delete newInputs[materialId];
        return newInputs;
      });
    }
  };

  const updateMaterial = (materialId: string, field: keyof Material, value: string) => {
    onUpdate(index, {
      materials: detail.materials.map((m) => {
        if (m.id === materialId) {
          const updatedMaterial = { ...m, [field]: value };
          if (field === "jenis") {
            if (value === "custom") {
              setMaterialCustomInputs((prev) => ({ ...prev, [materialId]: "" }));
            } else {
              setMaterialCustomInputs((prev) => {
                const newInputs = { ...prev };
                delete newInputs[materialId];
                return newInputs;
              });
              const normalizedJenis = value.toLowerCase().trim();
              const defaultUnit = materialDefaultUnits[normalizedJenis];
              if (defaultUnit) {
                updatedMaterial.satuan = defaultUnit;
              }
            }
          }
          return updatedMaterial;
        }
        return m;
      }),
    });
  };

  const updateMaterialCustomInput = (materialId: string, value: string) => {
    setMaterialCustomInputs((prev) => ({ ...prev, [materialId]: value }));
    onUpdate(index, {
      materials: detail.materials.map((m) =>
        m.id === materialId ? { ...m, jenis: value } : m
      ),
    });
  };

  // Helper to process files from drop/paste
  const processAndAddFiles = (files: FileList, field: 'foto0' | 'foto50' | 'foto100' | 'fotoSket') => {
    const newFiles = Array.from(files);
    if (newFiles.length > 0) {
      onUpdate(index, { [field]: [...detail[field], ...newFiles] });
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

  // Create handlers for each field
  const foto0Handlers = createDragAndPasteHandlers(setIsFoto0Dragging, 'foto0');
  const foto50Handlers = createDragAndPasteHandlers(setIsFoto50Dragging, 'foto50');
  const foto100Handlers = createDragAndPasteHandlers(setIsFoto100Dragging, 'foto100');
  const fotoSketHandlers = createDragAndPasteHandlers(setIsFotoSketDragging, 'fotoSket');

  return (
    <div className="border p-4 rounded-lg space-y-4 bg-muted/20 relative">
      {isRemovable && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      <h3 className="text-lg font-semibold mb-4">Detail Penanganan {index + 1}</h3>

      {/* Photos (Conditional for Harian/Bulanan vs Tersier) */}
      {reportType !== "tersier" ? (
        <div className="grid gap-4 md:grid-cols-4">
          {/* Foto 0% */}
          <div
            className={cn(
              "space-y-2 border-2 border-dashed rounded-md p-4 transition-colors",
              isFoto0Dragging ? "border-primary-foreground" : "border-gray-300"
            )}
            {...foto0Handlers}
          >
            <Label htmlFor={`foto-0-${detail.id}`}>Foto 0%</Label>
            <Input
              id={`foto-0-${detail.id}`}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileChange(e, 'foto0')}
            />
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
                      setPreviewUrl(url);
                      setShowPreviewDialog(true);
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
          {/* Foto 50% */}
          <div
            className={cn(
              "space-y-2 border-2 border-dashed rounded-md p-4 transition-colors",
              isFoto50Dragging ? "border-primary-foreground" : "border-gray-300"
            )}
            {...foto50Handlers}
          >
            <Label htmlFor={`foto-50-${detail.id}`}>Foto 50%</Label>
            <Input
              id={`foto-50-${detail.id}`}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileChange(e, 'foto50')}
            />
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
                      setPreviewUrl(url);
                      setShowPreviewDialog(true);
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
          {/* Foto 100% */}
          <div
            className={cn(
              "space-y-2 border-2 border-dashed rounded-md p-4 transition-colors",
              isFoto100Dragging ? "border-primary-foreground" : "border-gray-300"
            )}
            {...foto100Handlers}
          >
            <Label htmlFor={`foto-100-${detail.id}`}>Foto 100%</Label>
            <Input
              id={`foto-100-${detail.id}`}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileChange(e, 'foto100')}
            />
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
                      setPreviewUrl(url);
                      setShowPreviewDialog(true);
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
          {/* Foto Sket */}
          <div
            className={cn(
              "space-y-2 border-2 border-dashed rounded-md p-4 transition-colors",
              isFotoSketDragging ? "border-primary-foreground" : "border-gray-300"
            )}
            {...fotoSketHandlers}
          >
            <Label htmlFor={`foto-sket-${detail.id}`}>Gambar Sket</Label>
            <Input
              id={`foto-sket-${detail.id}`}
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={(e) => handleFileChange(e, 'fotoSket')}
            />
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
                        setPreviewUrl(url);
                        setShowPreviewDialog(true);
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
        </div>
      ) : (
        // Tersier specific photo inputs (Foto 0% and Foto 100%)
        <div className="grid gap-4 md:grid-cols-2">
          {/* Foto 0% (Sebelum) */}
          <div
            className={cn(
              "space-y-2 border-2 border-dashed rounded-md p-4 transition-colors",
              isFoto0Dragging ? "border-primary-foreground" : "border-gray-300"
            )}
            {...foto0Handlers}
          >
            <Label htmlFor={`foto-0-tersier-${detail.id}`}>Foto 0% (Sebelum)</Label>
            <Input
              id={`foto-0-tersier-${detail.id}`}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileChange(e, 'foto0')}
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(Array.isArray(detail.foto0) ? detail.foto0 : []).map((photo, photoIndex) => (
                <div key={photoIndex} className="relative group">
                  <img
                    src={
                      photo instanceof File
                        ? URL.createObjectURL(photo)
                        : photo || ''
                    }
                    alt={`Foto 0% (Sebelum) ${photoIndex + 1}`}
                    className="w-full h-24 object-cover rounded border cursor-pointer"
                    onClick={() => {
                      const url = photo instanceof File
                        ? URL.createObjectURL(photo)
                        : photo || '';
                      setPreviewUrl(url);
                      setShowPreviewDialog(true);
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
          {/* Foto 100% (Sesudah) */}
          <div
            className={cn(
              "space-y-2 border-2 border-dashed rounded-md p-4 transition-colors",
              isFoto100Dragging ? "border-primary-foreground" : "border-gray-300"
            )}
            {...foto100Handlers}
          >
            <Label htmlFor={`foto-100-tersier-${detail.id}`}>Foto 100% (Sesudah)</Label>
            <Input
              id={`foto-100-tersier-${detail.id}`}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileChange(e, 'foto100')}
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(Array.isArray(detail.foto100) ? detail.foto100 : []).map((photo, photoIndex) => (
                <div key={photoIndex} className="relative group">
                  <img
                    src={
                      photo instanceof File
                        ? URL.createObjectURL(photo)
                        : photo || ''
                    }
                    alt={`Foto 100% (Sesudah) ${photoIndex + 1}`}
                    className="w-full h-24 object-cover rounded border cursor-pointer"
                    onClick={() => {
                      const url = photo instanceof File
                        ? URL.createObjectURL(photo)
                        : photo || '';
                      setPreviewUrl(url);
                      setShowPreviewDialog(true);
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
        </div>
      )}

      {/* Jenis Saluran & Sedimen (Conditional for Harian/Bulanan) */}
      {reportType !== "tersier" && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`jenis-saluran-${detail.id}`}>Jenis Saluran</Label>
            <Select
              value={detail.jenisSaluran}
              onValueChange={(value) => onUpdate(index, { jenisSaluran: value as "Terbuka" | "Tertutup" | "Terbuka & Tertutup" | "" })}
            >
              <SelectTrigger id={`jenis-saluran-${detail.id}`}>
                <SelectValue placeholder="-" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Terbuka">Terbuka</SelectItem>
                <SelectItem value="Tertutup">Tertutup</SelectItem>
                <SelectItem value="Terbuka & Tertutup">Terbuka & Tertutup</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`jenis-sedimen-${detail.id}`}>Jenis Sedimen</Label>
            <Select
              value={selectedSedimenOption}
              onValueChange={(value) => {
                setSelectedSedimenOption(value);
                if (value === "custom") {
                  onUpdate(index, { jenisSedimen: customSedimen });
                } else {
                  onUpdate(index, { jenisSedimen: value });
                  setCustomSedimen("");
                }
              }}
            >
              <SelectTrigger id={`jenis-sedimen-${detail.id}`}>
                <SelectValue placeholder="Pilih jenis sedimen" />
              </SelectTrigger>
              <SelectContent>
                {predefinedSedimenOptions.map((jenis) => (
                  <SelectItem key={jenis} value={jenis}>
                    {jenis}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Lainnya</SelectItem>
              </SelectContent>
            </Select>
            {selectedSedimenOption === "custom" && (
              <Input
                id={`custom-jenis-sedimen-${detail.id}`}
                type="text"
                placeholder="Masukkan jenis sedimen manual"
                value={customSedimen}
                onChange={(e) => {
                  setCustomSedimen(e.target.value);
                  onUpdate(index, { jenisSedimen: e.target.value });
                }}
                className="mt-2"
              />
            )}
          </div>
        </div>
      )}

      {/* Aktifitas Penanganan (Conditional for Harian/Bulanan) */}
      {reportType !== "tersier" && (
        <div className="space-y-2">
          <Label htmlFor={`aktifitas-${detail.id}`}>Aktifitas Penanganan</Label>
          <Input
            id={`aktifitas-${detail.id}`}
            value={detail.aktifitasPenanganan}
            onChange={(e) => onUpdate(index, { aktifitasPenanganan: e.target.value })}
            placeholder="Contoh: Pembersihan dan Pengerukan"
          />
        </div>
      )}

      {/* Materials (Conditional for Harian/Bulanan) */}
      {reportType !== "tersier" && (
        <div className="space-y-4">
          <Label>Material yang Digunakan</Label>
          {detail.materials.map((material) => (
            <div key={material.id} className="grid gap-4 md:grid-cols-5 items-end">
              <div className="space-y-2">
                <Label htmlFor={`material-${material.id}-jenis`}>Jenis Material</Label>
                <Select
                  value={materialOptions.includes(material.jenis) ? material.jenis : "custom"}
                  onValueChange={(value) => updateMaterial(material.id, "jenis", value)}
                >
                  <SelectTrigger id={`material-${material.id}-jenis`}>
                    <SelectValue placeholder="Pilih material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materialOptions.map((jenis) => (
                      <SelectItem key={jenis} value={jenis}>
                        {jenis}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
                {material.jenis === "custom" ? (
                  <Input
                    id={`material-${material.id}-custom-jenis`}
                    type="text"
                    placeholder="Masukkan jenis material manual"
                    value={materialCustomInputs[material.id] || ""}
                    onChange={(e) => updateMaterialCustomInput(material.id, e.target.value)}
                    className="mt-2"
                  />
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`material-${material.id}-jumlah`}>Jumlah</Label>
                <Input
                  id={`material-${material.id}-jumlah`}
                  value={material.jumlah}
                  onChange={(e) => updateMaterial(material.id, "jumlah", e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`material-${material.id}-satuan`}>Satuan</Label>
                <Select
                  value={material.satuan}
                  onValueChange={(value) => updateMaterial(material.id, "satuan", value)}
                >
                  <SelectTrigger id={`material-${material.id}-satuan`}>
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
                <Label htmlFor={`material-${material.id}-keterangan`}>Keterangan</Label>
                <Input
                  id={`material-${material.id}-keterangan`}
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

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Preview Foto</DialogTitle>
            <DialogDescription>
              Preview gambar yang diunggah
            </DialogDescription>
          </DialogHeader>
          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="w-full h-[70vh] object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};