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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LaporanDrainase, KegiatanDrainase, Material, Peralatan, OperasionalAlatBerat } from "@/types/laporan"; // Import LaporanDrainase
import { LaporanBulananData, KegiatanDrainaseBulanan } from "@/types/laporan-bulanan"; // Import new types
import { generatePDF } from "@/lib/pdf-generator"; // For harian
import { generatePDFBulanan } from "@/lib/pdf-generator-bulanan"; // For bulanan
import { Loader2, Printer, X } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DrainasePrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  laporanIdsToFetch: string[]; // Array of laporan IDs to fetch activities from (used for harian)
  reportType: "harian" | "bulanan"; // Type of report to generate
  filterPeriod: string | null; // Optional filter for bulanan reports
}

// Use KegiatanDrainaseBulanan for activities in the dialog
interface KegiatanItemForPrint extends KegiatanDrainaseBulanan {
  tanggalKegiatan: string; // Added this property
}

const DrainasePrintDialog: React.FC<DrainasePrintDialogProps> = ({
  isOpen,
  onClose,
  laporanIdsToFetch,
  reportType,
  filterPeriod,
}) => {
  const [allKegiatans, setAllKegiatans] = useState<KegiatanItemForPrint[]>([]);
  const [selectedKegiatanIds, setSelectedKegiatanIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchKegiatansForPrint();
    } else {
      setAllKegiatans([]);
      setSelectedKegiatanIds(new Set());
      setLoading(true);
      setIsPrinting(false);
    }
  }, [isOpen, laporanIdsToFetch, reportType, filterPeriod]);

  const fetchKegiatansForPrint = async () => {
    setLoading(true);
    try {
      const fetchedKegiatans: KegiatanItemForPrint[] = [];
      
      let targetLaporanIds = laporanIdsToFetch;
      let periodLaporanDates: { [key: string]: Date } = {}; // Map laporanId to its date

      if (reportType === "bulanan" && filterPeriod) {
        const { data: periodLaporans, error: periodError } = await supabase
          .from("laporan_drainase")
          .select("id, tanggal")
          .eq("periode", filterPeriod)
          .order("tanggal", { ascending: true });

        if (periodError) throw periodError;
        targetLaporanIds = periodLaporans.map(l => l.id);
        periodLaporanDates = periodLaporans.reduce((acc, curr) => {
          acc[curr.id] = new Date(curr.tanggal);
          return acc;
        }, {} as { [key: string]: Date });
      } else if (reportType === "harian" && laporanIdsToFetch.length > 0) {
        // For harian, we need the date of the single report being printed
        const { data: singleLaporan, error: singleLaporanError } = await supabase
          .from("laporan_drainase")
          .select("tanggal")
          .eq("id", laporanIdsToFetch[0])
          .single();
        if (singleLaporanError) throw singleLaporanError;
        periodLaporanDates[laporanIdsToFetch[0]] = new Date(singleLaporan.tanggal);
      }


      if (targetLaporanIds.length === 0) {
        setAllKegiatans([]);
        setSelectedKegiatanIds(new Set());
        setLoading(false);
        return;
      }

      for (const laporanId of targetLaporanIds) {
        const currentLaporanDate = periodLaporanDates[laporanId];
        if (!currentLaporanDate) {
          console.warn(`Laporan date not found for ID ${laporanId}. Skipping activities.`);
          continue;
        }
        
        const { data: kegiatanData, error: kegiatanError } = await supabase
          .from('kegiatan_drainase')
          .select('*')
          .eq('laporan_id', laporanId)
          .order('created_at', { ascending: true });

        if (kegiatanError) {
          console.error(`Error fetching kegiatan list for laporan ID ${laporanId}:`, kegiatanError);
          toast.error(`Gagal memuat daftar kegiatan untuk laporan ID ${laporanId}.`);
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
          materials: [], // Will be fetched later for selected items
          peralatans: [], // Will be fetched later for selected items
          operasionalAlatBerats: [], // Will be fetched later for selected items
          koordinator: kegiatan.koordinator || [],
          jumlahPHL: kegiatan.jumlah_phl || 1,
          // For bulanan report, these fields are not displayed, but for harian they are.
          // So we keep them in the type, but the PDF generator for bulanan will ignore them.
          jumlahUPT: kegiatan.jumlah_upt || 0, 
          jumlahP3SU: kegiatan.jumlah_p3su || 0,
          keterangan: kegiatan.keterangan || "",
          tanggalKegiatan: format(currentLaporanDate, "dd MMMM yyyy", { locale: idLocale }),
          laporanTanggal: currentLaporanDate, // Crucial for monthly report sorting and display
        }));
        fetchedKegiatans.push(...mappedKegiatans);
      }

      // Sort activities by their parent report date, then by activity creation date
      fetchedKegiatans.sort((a, b) => {
        if (a.laporanTanggal.getTime() !== b.laporanTanggal.getTime()) {
          return a.laporanTanggal.getTime() - b.laporanTanggal.getTime();
        }
        // If dates are the same, maintain original order (or add another sort key if available)
        return 0; 
      });

      setAllKegiatans(fetchedKegiatans);
      setSelectedKegiatanIds(new Set(fetchedKegiatans.map(k => k.id))); // Select all by default
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
    if (selectedKegiatanIds.size === 0) {
      toast.error("Pilih setidaknya satu kegiatan untuk dicetak.");
      return;
    }

    setIsPrinting(true);
    try {
      const selectedKegiatansWithDetails: KegiatanItemForPrint[] = []; // Changed type here
      
      for (const kegiatanId of selectedKegiatanIds) {
        const baseKegiatan = allKegiatans.find(k => k.id === kegiatanId);
        if (baseKegiatan) {
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

          selectedKegiatansWithDetails.push({
            ...baseKegiatan, // Keep laporanTanggal for sorting/display in monthly report
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

      // Sort activities by their report date for the PDF
      selectedKegiatansWithDetails.sort((a, b) => a.laporanTanggal.getTime() - b.laporanTanggal.getTime());

      if (reportType === "harian") {
        // For harian, we need a single LaporanDrainase object.
        // The generatePDF function expects a single date for the report.
        // If multiple activities are selected for a 'harian' print, it will use the earliest date.
        const earliestDateForReport = selectedKegiatansWithDetails.reduce((minDate, current) => {
          return (minDate === null || current.laporanTanggal < minDate) ? current.laporanTanggal : minDate;
        }, null as Date | null);

        const laporanToPrint: LaporanDrainase = {
          tanggal: earliestDateForReport,
          kegiatans: selectedKegiatansWithDetails.map(({ laporanTanggal, tanggalKegiatan, ...rest }) => rest), // Cast to KegiatanDrainase[] as generatePDF expects it
        };
        await generatePDF(laporanToPrint, true);
      } else if (reportType === "bulanan") {
        if (!filterPeriod) {
          toast.error("Periode filter tidak ditemukan untuk laporan bulanan.");
          return;
        }
        const laporanBulananToPrint: LaporanBulananData = {
          periode: filterPeriod,
          kegiatans: selectedKegiatansWithDetails,
        };
        await generatePDFBulanan(laporanBulananToPrint);
      }
      
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
        <DialogHeader className="shrink-0">
          <DialogTitle>Cetak Laporan Drainase ({reportType === "harian" ? "Harian" : "Bulanan"})</DialogTitle>
          <DialogDescription>
            Pilih kegiatan yang ingin Anda sertakan dalam laporan PDF.
            {reportType === "bulanan" && filterPeriod && <span className="font-semibold"> (Periode: {filterPeriod})</span>}
            {reportType === "bulanan" && ( // Hanya tampilkan catatan ini jika reportType adalah "bulanan"
              <p className="text-red-500 text-xs mt-1">
                Catatan: Laporan bulanan akan menggabungkan semua kegiatan yang dipilih dalam satu dokumen.
              </p>
            )}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Memuat kegiatan...</span>
          </div>
        ) : allKegiatans.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Tidak ada kegiatan untuk laporan ini.</p>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center space-x-2 my-4 shrink-0">
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
            <div className="flex-1 overflow-y-auto pr-4"> {/* Using div with overflow-y-auto */}
              <div className="space-y-3">
                {allKegiatans.map((kegiatan) => {
                  const isSelected = selectedKegiatanIds.has(kegiatan.id);
                  return (
                    <div
                      key={kegiatan.id}
                      className={cn(
                        "flex items-start space-x-2 border-b pb-2 last:border-b-0 p-2 rounded-md cursor-pointer",
                        "hover:bg-muted/50 transition-colors",
                        isSelected && "bg-primary/10"
                      )}
                      onClick={() => handleCheckboxChange(kegiatan.id, !isSelected)}
                    >
                      <Checkbox
                        id={`kegiatan-${kegiatan.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(kegiatan.id, checked as boolean)
                        }
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor={`kegiatan-${kegiatan.id}`} className="font-medium text-base cursor-pointer">
                          {kegiatan.namaJalan} - {kegiatan.kelurahan}, {kegiatan.kecamatan}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {kegiatan.aktifitasPenanganan} ({kegiatan.tanggalKegiatan})
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 shrink-0">
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

export default DrainasePrintDialog;