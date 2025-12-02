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
  laporanId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface KegiatanItemForPrint extends KegiatanDrainase {
  tanggalKegiatan: string; // To display the date of the activity
}

export const PrintDrainaseDialog: React.FC<PrintDrainaseDialogProps> = ({
  laporanId,
  isOpen,
  onClose,
}) => {
  const [laporanTanggal, setLaporanTanggal] = useState<Date | null>(null);
  const [allKegiatans, setAllKegiatans] = useState<KegiatanItemForPrint[]>([]);
  const [selectedKegiatanIds, setSelectedKegiatanIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (isOpen && laporanId) {
      fetchKegiatansForLaporan(laporanId);
    } else {
      // Reset state when dialog closes
      setLaporanTanggal(null);
      setAllKegiatans([]);
      setSelectedKegiatanIds(new Set());
      setLoading(true);
      setIsPrinting(false);
    }
  }, [isOpen, laporanId]);

  const fetchKegiatansForLaporan = async (id: string) => {
    setLoading(true);
    try {
      // Fetch laporan details to get the main date
      const { data: laporanData, error: laporanError } = await supabase
        .from('laporan_drainase')
        .select('tanggal')
        .eq('id', id)
        .single();

      if (laporanError) {
        console.error("Error fetching laporan tanggal:", laporanError);
        throw new Error("Gagal memuat tanggal laporan.");
      }
      setLaporanTanggal(new Date(laporanData.tanggal));

      // Fetch all activities for the report
      const { data: kegiatanData, error: kegiatanError } = await supabase
        .from('kegiatan_drainase')
        .select('*')
        .eq('laporan_id', id)
        .order('created_at', { ascending: true }); // Order by creation to maintain consistency

      if (kegiatanError) {
        console.error("Error fetching kegiatan list:", kegiatanError);
        throw new Error("Gagal memuat daftar kegiatan.");
      }

      const mappedKegiatans: KegiatanItemForPrint[] = (kegiatanData || []).map((kegiatan) => ({
        id: kegiatan.id,
        namaJalan: kegiatan.nama_jalan,
        kecamatan: kegiatan.kecamatan,
        kelurahan: kegiatan.kelurahan,
        foto0: kegiatan.foto_0_url || null,
        foto50: kegiatan.foto_50_url || null,
        foto100: kegiatan.foto_100_url || null,
        foto0Url: kegiatan.foto_0_url || undefined,
        foto50Url: kegiatan.foto_50_url || undefined,
        foto100Url: kegiatan.foto_100_url || undefined,
        jenisSaluran: (kegiatan.jenis_saluran || "") as "" | "Terbuka" | "Tertutup",
        jenisSedimen: (kegiatan.jenis_sedimen || "") as "" | "Padat" | "Cair" | "Padat & Cair",
        aktifitasPenanganan: kegiatan.aktifitas_penanganan || "",
        panjangPenanganan: kegiatan.panjang_penanganan || "",
        lebarRataRata: kegiatan.lebar_rata_rata || "",
        rataRataSedimen: kegiatan.rata_rata_sedimen || "",
        volumeGalian: kegiatan.volume_galian || "",
        materials: [], // Will be fetched later if selected
        peralatans: [], // Will be fetched later if selected
        operasionalAlatBerats: [], // Will be fetched later if selected
        koordinator: kegiatan.koordinator || [],
        jumlahPHL: kegiatan.jumlah_phl || 1,
        keterangan: kegiatan.keterangan || "",
        tanggalKegiatan: format(new Date(kegiatan.created_at), "dd MMMM yyyy", { locale: idLocale }), // Use created_at for display
      }));

      setAllKegiatans(mappedKegiatans);
      // Select all by default
      setSelectedKegiatanIds(new Set(mappedKegiatans.map(k => k.id)));
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
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedKegiatanIds(new Set(allKegiatans.map(k => k.id)));
    } else {
      setSelectedKegiatanIds(new Set());
    }
  };

  const handlePrintSelected = async () => {
    if (!laporanTanggal) {
      toast.error("Tanggal laporan tidak ditemukan.");
      return;
    }
    if (selectedKegiatanIds.size === 0) {
      toast.error("Pilih setidaknya satu kegiatan untuk dicetak.");
      return;
    }

    setIsPrinting(true);
    try {
      const selectedKegiatans: KegiatanDrainase[] = [];

      for (const kegiatanId of selectedKegiatanIds) {
        const baseKegiatan = allKegiatans.find(k => k.id === kegiatanId);
        if (baseKegiatan) {
          // Fetch full details for selected activities
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

      const laporanToPrint: LaporanDrainase = {
        tanggal: laporanTanggal,
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
          <>
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
            <ScrollArea className="flex-1 pr-4">
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
                          {kegiatan.aktifitasPenanganan} ({kegiatan.tanggalKegiatan})
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </>
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