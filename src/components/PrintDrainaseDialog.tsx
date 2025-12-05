import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LaporanDrainase, KegiatanDrainase, Material, Peralatan, OperasionalAlatBerat } from "@/types/laporan";
import { generatePDF } from "@/lib/pdf-generator";
import { Loader2, Printer, X } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface PrintDrainaseDialogProps {
  laporanIds: string[];
  isOpen: boolean;
  onClose: () => void;
}

interface KegiatanItemForPrint extends KegiatanDrainase {
  tanggalKegiatan: string;
  laporanTanggal: Date;
}

export const PrintDrainaseDialog: React.FC<PrintDrainaseDialogProps> = ({
  laporanIds,
  isOpen,
  onClose,
}) => {
  const [allKegiatans, setAllKegiatans] = useState<KegiatanItemForPrint[]>([]);
  const [selectedKegiatanIds, setSelectedKegiatanIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (isOpen && laporanIds.length > 0) {
      fetchKegiatansForLaporans(laporanIds);
    } else {
      setAllKegiatans([]);
      setSelectedKegiatanIds(new Set());
      setLoading(true);
      setIsPrinting(false);
    }
  }, [isOpen, laporanIds]);

  const fetchKegiatansForLaporans = async (ids: string[]) => {
    setLoading(true);
    try {
      const allFetchedKegiatans: KegiatanItemForPrint[] = [];
      let earliestLaporanDate: Date | null = null;

      for (const id of ids) {
        const { data: laporanData, error: laporanError } = await supabase
          .from('laporan_drainase')
          .select('tanggal')
          .eq('id', id)
          .single();

        if (laporanError) {
          console.error(`Error fetching laporan tanggal for ID ${id}:`, laporanError);
          toast.error(`Gagal memuat tanggal laporan untuk ID ${id}.`);
          continue;
        }
        const currentLaporanDate = new Date(laporanData.tanggal);
        if (!earliestLaporanDate || currentLaporanDate < earliestLaporanDate) {
          earliestLaporanDate = currentLaporanDate;
        }

        const { data: kegiatanData, error: kegiatanError } = await supabase
          .from('kegiatan_drainase')
          .select('*')
          .eq('laporan_id', id)
          .order('created_at', { ascending: true });

        if (kegiatanError) {
          console.error(`Error fetching kegiatan list for laporan ID ${id}:`, kegiatanError);
          toast.error(`Gagal memuat daftar kegiatan untuk laporan ID ${id}.`);
          continue;
        }

        const mappedKegiatans: KegiatanItemForPrint[] = (kegiatanData || []).map((kegiatan) => ({
          id: kegiatan.id,
          namaJalan: kegiatan.nama_jalan,
          kecamatan: kegiatan.kecamatan,
          kelurahan: kegiatan.kelurahan,
          foto0: kegiatan.foto_0_url || [],
          foto50: kegiatan.foto_50_url || [],
          foto100: kegiatan.foto_100_url || [],
          foto0Url: kegiatan.foto_0_url || undefined,
          foto50Url: kegiatan.foto_50_url || undefined,
          foto100Url: kegiatan.foto_100_url || undefined,
          jenisSaluran: (kegiatan.jenis_saluran || "") as "" | "Terbuka" | "Tertutup" | "Terbuka & Tertutup",
          jenisSedimen: (kegiatan.jenis_sedimen || "") as "" | "Padat" | "Cair" | "Padat & Cair" | "Batu" | "Batu/Padat" | "Batu/Cair" | "Padat & Batu" | "Padat & Sampah" | "Padat/ Gulma & Sampah" | "Padat/ Cair/Sampah" | "Gulma/Rumput" | "" | "Batu/ Padat & Cair",
          aktifitasPenanganan: kegiatan.aktifitas_penanganan || "",
          panjangPenanganan: kegiatan.panjang_penanganan || "",
          lebarRataRata: kegiatan.lebar_rata_rata || "",
          rataRataSedimen: kegiatan.rata_rata_sedimen || "",
          volumeGalian: kegiatan.volume_galian || "",
          materials: [],
          peralatans: [],
          operasionalAlatBerats: [],
          koordinator: kegiatan.koordinator || [],
          jumlahPHL: kegiatan.jumlah_phl || 1,
          keterangan: kegiatan.keterangan || "",
          tanggalKegiatan: format(new Date(kegiatan.created_at), "dd MMMM yyyy", { locale: idLocale }),
          laporanTanggal: currentLaporanDate,
        }));
        allFetchedKegiatans.push(...mappedKegiatans);
      }

      allFetchedKegiatans.sort((a, b) => {
        if (a.laporanTanggal.getTime() !== b.laporanTanggal.getTime()) {
          return a.laporanTanggal.getTime() - b.laporanTanggal.getTime();
        }
        return new Date(a.tanggalKegiatan).getTime() - new Date(b.tanggalKegiatan).getTime();
      });

      console.log("Fetched Kegiatans for PrintDrainaseDialog:", allFetchedKegiatans); // Debug log
      setAllKegiatans(allFetchedKegiatans);
      setSelectedKegiatanIds(new Set(allFetchedKegiatans.map(k => k.id)));
    } catch (error: any) {
      console.error("Error fetching activities for print:", error);
      toast.error("Gagal memuat daftar kegiatan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (kegiatanId: string, checked: boolean) => {
    setSelectedKegiatanIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(kegiatanId);
      } else {
        newSet.delete(kegiatanId);
      }
      console.log(`Checkbox for ${kegiatanId} changed to ${checked}. Current selected IDs:`, newSet); // Debug log
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedKegiatanIds(new Set(allKegiatans.map(k => k.id)));
    } else {
      setSelectedKegiatanIds(new Set());
    }
    console.log(`Select All changed to ${checked}. Current selected IDs:`, selectedKegiatanIds); // Debug log
  };

  const handlePrintSelected = async () => {
    if (selectedKegiatanIds.size === 0) {
      toast.error("Pilih setidaknya satu kegiatan untuk dicetak.");
      return;
    }

    setIsPrinting(true);
    try {
      const selectedKegiatans: KegiatanItemForPrint[] = [];
      let earliestDate: Date | null = null;

      for (const kegiatanId of selectedKegiatanIds) {
        const baseKegiatan = allKegiatans.find(k => k.id === kegiatanId);
        if (baseKegiatan) {
          if (!earliestDate || baseKegiatan.laporanTanggal < earliestDate) {
            earliestDate = baseKegiatan.laporanTanggal;
          }

          const [materialsRes, peralatanRes, operasionalRes] = await Promise.all([
            supabase.from('material_kegiatan').select('*').eq('kegiatan_id', kegiatanId),
            supabase.from('peralatan_kegiatan').select('*').eq('kegiatan_id', kegiatanId),
            supabase.from('operasional_alat_berat_kegiatan').select('*').eq('kegiatan_id', kegiatanId)
          ]);

          if (materialsRes.error) {
            console.error("Error fetching materials:", materialsRes.error);
            throw new Error("Gagal memuat material untuk kegiatan.");
          }
          if (peralatanRes.error) {
            console.error("Error fetching peralatan:", peralatanRes.error);
            throw new Error("Gagal memuat peralatan untuk kegiatan.");
          }
          if (operasionalRes.error) {
            console.error("Error fetching operasional alat berat:", operasionalRes.error);
            throw new Error("Gagal memuat operasional alat berat untuk kegiatan.");
          }

          selectedKegiatans.push({
            ...baseKegiatan,
            materials: (materialsRes.data || []).map(m => ({
              id: m.id,
              jenis: m.jenis,
              jumlah: m.jumlah,
              satuan: m.satuan,
              keterangan: m.keterangan || "",
            })),
            peralatans: (peralatanRes.data || []).map(p => ({
              id: p.id,
              nama: p.nama,
              jumlah: p.jumlah,
              satuan: p.satuan || "Unit",
            })),
            operasionalAlatBerats: (operasionalRes.data || []).map(o => ({
              id: o.id,
              jenis: o.jenis,
              jumlah: o.jumlah,
              dexliteJumlah: o.dexlite_jumlah || "",
              dexliteSatuan: o.dexlite_satuan || "Liter",
              pertaliteJumlah: o.pertalite_jumlah || "",
              pertaliteSatuan: o.pertalite_satuan || "Liter",
              bioSolarJumlah: o.bio_solar_jumlah || "",
              bioSolarSatuan: o.bio_solar_satuan || "Liter",
              keterangan: o.keterangan || "",
            })),
          });
        }
      }

      selectedKegiatans.sort((a, b) => {
        if (a.laporanTanggal.getTime() !== b.laporanTanggal.getTime()) {
          return a.laporanTanggal.getTime() - b.laporanTanggal.getTime();
        }
        return new Date(a.tanggalKegiatan).getTime() - new Date(b.tanggalKegiatan).getTime();
      });

      const laporanToPrint: LaporanDrainase = {
        tanggal: earliestDate,
        kegiatans: selectedKegiatans,
      };

      await generatePDF(laporanToPrint, true);
      toast.success("Laporan PDF berhasil dibuat.");
      onClose();
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error("Gagal membuat laporan PDF: " + error.message);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Cetak Laporan Drainase</DialogTitle>
          <DialogDescription>
            Pilih kegiatan yang ingin Anda sertakan dalam laporan PDF.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Memuat kegiatan...</span>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="select-all"
                checked={selectedKegiatanIds.size === allKegiatans.length && allKegiatans.length > 0}
                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                disabled={allKegiatans.length === 0}
              />
              <Label htmlFor="select-all" className="font-semibold">
                Pilih Semua ({selectedKegiatanIds.size}/{allKegiatans.length})
              </Label>
            </div>
            <ScrollArea className="h-full pr-4"> {/* Changed max-h-[60vh] to h-full */}
              <div className="space-y-3">
                {allKegiatans.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Tidak ada kegiatan untuk laporan ini.</p>
                ) : (
                  allKegiatans.map((kegiatan) => (
                    <div key={kegiatan.id} className="flex items-start space-x-2 border-b pb-2 last:border-b-0">
                      <Checkbox
                        id={`kegiatan-${kegiatan.id}`}
                        checked={selectedKegiatanIds.has(kegiatan.id)}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(kegiatan.id, checked as boolean)
                        }
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor={`kegiatan-${kegiatan.id}`} className="font-medium text-base">
                          {kegiatan.namaJalan} - {kegiatan.kelurahan}, {kegiatan.kecamatan}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {kegiatan.aktifitasPenanganan} ({format(kegiatan.laporanTanggal, "dd MMMM yyyy", { locale: idLocale })})
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isPrinting}>
            <X className="mr-2 h-4 w-4" />
            Batal
          </Button>
          <Button onClick={handlePrintSelected} disabled={selectedKegiatanIds.size === 0 || isPrinting}>
            {isPrinting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mencetak...
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                Cetak yang Dipilih
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};