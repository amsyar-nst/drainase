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
import { LaporanDrainase, KegiatanDrainase, Material, Peralatan, OperasionalAlatBerat, AktifitasPenangananDetail } from "@/types/laporan";
import { generatePDF } from "@/lib/pdf-generator";
import { generatePDFBulanan } from "@/lib/pdf-generator-bulanan";
import { generatePDFTersier } from "@/lib/pdf-generator-tersier";
import { Loader2, Printer, X } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { materialOptions } from "@/data/kecamatan-kelurahan"; // Import materialOptions
import { PenangananDetailFormState } from "@/types/form-types"; // Import PenangananDetailFormState
import { useSession } from "./SessionContextProvider"; // Import useSession

interface DrainasePrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  laporanIdsToFetch: string[];
  reportType: "harian" | "bulanan" | "tersier";
  filterPeriod: string | null;
}

interface KegiatanItemForPrint extends KegiatanDrainase {
  tanggalKegiatan: string;
  laporanTanggal: Date;
  reportType: "harian" | "tersier";
}

const predefinedSedimenOptions = [
  "Padat", "Cair", "Padat & Cair", "Batu", "Batu/Padat", "Batu/Cair",
  "Padat & Batu", "Padat/ Gulma & Sampah", "Padat/ Cair/Sampah", "Gulma/Rumput",
  "Batu/ Padat & Cair", "Sampah"
];

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
  const { user } = useSession(); // Dapatkan user dari session

  useEffect(() => {
    if (isOpen) {
      fetchKegiatansForPrint();
    } else {
      setAllKegiatans([]);
      setSelectedKegiatanIds(new Set());
      setLoading(true);
      setIsPrinting(false);
    }
  }, [isOpen, laporanIdsToFetch, reportType, filterPeriod, user]); // Tambahkan user sebagai dependency

  const ensureArray = (value: string | string[] | null | undefined): string[] => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string' && value) {
      return [value];
    }
    return [];
  };

  const fetchKegiatansForPrint = async () => {
    setLoading(true);
    try {
      if (!user) {
        toast.error('Anda harus login untuk memuat kegiatan.');
        setLoading(false);
        return;
      }

      const fetchedKegiatans: KegiatanItemForPrint[] = [];
      
      let targetLaporanIds = laporanIdsToFetch;
      let periodLaporanDates: { [key: string]: Date } = {};
      let periodLaporanPeriode: { [key: string]: string } = {};

      if (reportType === "bulanan" && filterPeriod) {
        const { data: periodLaporans, error: periodError } = await supabase
          .from("laporan_drainase")
          .select("id, tanggal, periode")
          .eq("periode", filterPeriod)
          .eq("report_type", "harian")
          .eq('user_id', user.id) // Tambahkan filter user_id untuk RLS
          .order("tanggal", { ascending: true });

        if (periodError) throw periodError;
        targetLaporanIds = periodLaporans.map(l => l.id);
        periodLaporans.forEach(l => {
          periodLaporanDates[l.id] = new Date(l.tanggal);
          periodLaporanPeriode[l.id] = l.periode;
        });
      } else if ((reportType === "harian" || reportType === "tersier") && laporanIdsToFetch.length > 0) {
        const { data: singleLaporan, error: singleLaporanError } = await supabase
          .from("laporan_drainase")
          .select("tanggal, periode, report_type")
          .eq("id", laporanIdsToFetch[0])
          .eq('user_id', user.id) // Tambahkan filter user_id untuk RLS
          .single();
        if (singleLaporanError) throw singleLaporanError;
        periodLaporanDates[laporanIdsToFetch[0]] = new Date(singleLaporan.tanggal);
        periodLaporanPeriode[laporanIdsToFetch[0]] = singleLaporan.periode;
      }

      if (targetLaporanIds.length === 0) {
        setAllKegiatans([]);
        setSelectedKegiatanIds(new Set());
        setLoading(false);
        return;
      }

      for (const laporanId of targetLaporanIds) {
        const currentLaporanDate = periodLaporanDates[laporanId];
        const currentPeriode = periodLaporanPeriode[laporanId];

        if (!currentLaporanDate || !currentPeriode) {
          console.warn(`Laporan details not found for ID ${laporanId}. Skipping activities.`);
          continue;
        }
        
        const { data: kegiatanData, error: kegiatanError } = await supabase
          .from('kegiatan_drainase')
          .select('*')
          .eq('laporan_id', laporanId);

        if (kegiatanError) {
          console.error(`Error fetching kegiatan list for laporan ID ${laporanId}:`, kegiatanError);
          toast.error(`Gagal memuat daftar kegiatan untuk laporan ID ${laporanId}: ` + (kegiatanError.message || JSON.stringify(kegiatanError)));
          continue;
        }

        for (const kegiatan of (kegiatanData || [])) {
          const [peralatanRes, operasionalRes, aktifitasDetailsRes] = await Promise.all([
            supabase.from('peralatan_kegiatan').select('*').eq('kegiatan_id', kegiatan.id),
            supabase.from('operasional_alat_berat_kegiatan').select('*').eq('kegiatan_id', kegiatan.id),
            supabase.from('aktifitas_penanganan_detail').select('*').eq('kegiatan_id', kegiatan.id),
          ]);

          const peralatans = (peralatanRes.data || []).map(p => ({
            id: p.id,
            nama: p.nama,
            jumlah: p.jumlah,
            satuan: p.satuan || "Unit",
          }));

          const operasionalAlatBerats = (operasionalRes.data || []).map(o => ({
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
          }));

          const aktifitasPenangananDetails: PenangananDetailFormState[] = await Promise.all(
            (aktifitasDetailsRes.data || []).map(async (detail) => {
              const { data: materialsRes, error: materialsError } = await supabase
                .from('material_kegiatan')
                .select('*')
                .eq('aktifitas_detail_id', detail.id);

              if (materialsError) {
                console.error("Error fetching materials for aktifitas_detail_id:", detail.id, materialsError);
                toast.error(`Gagal memuat material untuk detail aktifitas ${detail.id}: ` + (materialsError.message || JSON.stringify(materialsError)));
                throw materialsError;
              }

              const materials = (materialsRes || []).map(m => ({ // FIX: materialsRes.data -> materialsRes
                id: m.id,
                jenis: m.jenis,
                jumlah: m.jumlah,
                satuan: m.satuan,
                keterangan: m.keterangan || "",
                aktifitas_detail_id: m.aktifitas_detail_id || null, // Pastikan ini null jika tidak ada
              }));

              // Initialize materialCustomInputs for printing
              const initialMaterialCustomInputs: Record<string, string> = {};
              materials.forEach(m => {
                if (!materialOptions.includes(m.jenis) && m.jenis !== "") {
                  initialMaterialCustomInputs[m.id] = m.jenis;
                  // Note: We don't change m.jenis to "custom" here, as we want the actual name for printing
                }
              });

              let selectedSedimenOption: string = "";
              let customSedimen: string = "";
              if (detail.jenis_sedimen) {
                if (predefinedSedimenOptions.includes(detail.jenis_sedimen)) {
                  selectedSedimenOption = detail.jenis_sedimen;
                } else {
                  selectedSedimenOption = "custom";
                  customSedimen = detail.jenis_sedimen;
                }
              }

              return {
                id: detail.id,
                kegiatanId: detail.kegiatan_id,
                jenisSaluran: (detail.jenis_saluran || "") as "Terbuka" | "Tertutup" | "Terbuka & Tertutup" | "",
                jenisSedimen: (detail.jenis_sedimen || "") as string,
                aktifitasPenanganan: detail.aktifitas_penanganan || "",
                foto0: ensureArray(detail.foto_0_url),
                foto50: ensureArray(detail.foto_50_url),
                foto100: ensureArray(detail.foto_100_url),
                fotoSket: ensureArray(detail.foto_sket_url),
                foto0Url: ensureArray(detail.foto_0_url),
                foto50Url: ensureArray(detail.foto_50_url),
                foto100Url: ensureArray(detail.foto_100_url),
                fotoSketUrl: ensureArray(detail.foto_sket_url),
                materials: materials,
                selectedSedimenOption: selectedSedimenOption, // UI state
                customSedimen: customSedimen, // UI state
                materialCustomInputs: initialMaterialCustomInputs, // UI state
              };
            })
          );

          fetchedKegiatans.push({
            id: kegiatan.id,
            namaJalan: kegiatan.nama_jalan,
            kecamatan: kegiatan.kecamatan,
            kelurahan: kegiatan.kelurahan,
            panjangPenanganan: kegiatan.panjang_penanganan || "",
            lebarRataRata: kegiatan.lebar_rata_rata || "",
            rataRataSedimen: kegiatan.rata_rata_sedimen || "",
            volumeGalian: kegiatan.volume_galian || "",
            peralatans: peralatans,
            operasionalAlatBerats: operasionalAlatBerats,
            koordinator: kegiatan.koordinator || [],
            jumlahPHL: kegiatan.jumlah_phl || 1,
            keterangan: kegiatan.keterangan || "",
            tanggalKegiatan: format(currentLaporanDate, "dd MMMM yyyy", { locale: idLocale }),
            laporanTanggal: currentLaporanDate,
            reportType: reportType === "tersier" ? "tersier" : "harian",
            hariTanggal: kegiatan.hari_tanggal ? new Date(kegiatan.hari_tanggal) : null,
            jumlahUPT: kegiatan.jumlah_upt || 0,
            jumlahP3SU: kegiatan.jumlah_p3su || 0,
            rencanaPanjang: kegiatan.rencana_panjang || "",
            rencanaVolume: kegiatan.rencana_volume || "",
            realisasiPanjang: kegiatan.realisasi_panjang || "",
            realisasiVolume: kegiatan.realisasi_volume || "",
            sisaTargetHari: kegiatan.sisa_target || "",
            aktifitasPenangananDetails: aktifitasPenangananDetails,
          });
        }
      }

      fetchedKegiatans.sort((a, b) => {
        if (a.laporanTanggal.getTime() !== b.laporanTanggal.getTime()) {
          return a.laporanTanggal.getTime() - b.laporanTanggal.getTime();
        }
        return 0; 
      });

      setAllKegiatans(fetchedKegiatans);
      setSelectedKegiatanIds(new Set(fetchedKegiatans.map(k => k.id)));
    } catch (error: any) {
      console.error("Error fetching activities for print:", error);
      toast.error("Gagal memuat daftar kegiatan: " + (error.message || JSON.stringify(error)));
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
      const selectedKegiatansWithDetails: KegiatanItemForPrint[] = [];
      
      for (const kegiatanId of selectedKegiatanIds) {
        const baseKegiatan = allKegiatans.find(k => k.id === kegiatanId);
        if (baseKegiatan) {
          // Since aktifitasPenangananDetails and materials are already fetched and nested,
          // we just need to ensure custom inputs are resolved if they were used.
          const resolvedKegiatan: KegiatanItemForPrint = {
            ...baseKegiatan,
            aktifitasPenangananDetails: baseKegiatan.aktifitasPenangananDetails.map(detail => ({
              ...detail,
              materials: detail.materials.map(m => ({
                ...m,
                // Use the resolved custom material name if it exists, otherwise use the stored name
                jenis: m.jenis === "custom" ? (detail.materialCustomInputs?.[m.id] || "") : m.jenis,
              })),
            })),
            // Assuming peralatan and operasional custom inputs are resolved at the form level
            // For print dialog, we might need to re-fetch or pass them if they are not stored in DB as resolved values
            // For now, we'll assume the DB stores the resolved values or they are not 'custom' at this stage.
          };
          selectedKegiatansWithDetails.push(resolvedKegiatan);
        }
      }

      selectedKegiatansWithDetails.sort((a, b) => a.laporanTanggal.getTime() - b.laporanTanggal.getTime());

      const overallPeriode = filterPeriod || format(selectedKegiatansWithDetails[0].laporanTanggal, 'MMMM yyyy', { locale: idLocale });
      const overallTanggal = selectedKegiatansWithDetails[0].laporanTanggal;

      const laporanToPrint: LaporanDrainase = {
        tanggal: overallTanggal,
        periode: overallPeriode,
        reportType: reportType,
        kegiatans: selectedKegiatansWithDetails.map(({ laporanTanggal, tanggalKegiatan, reportType: activityReportType, ...rest }) => ({
          ...rest,
          hariTanggal: laporanTanggal,
        })),
      };

      if (reportType === "harian") {
        await generatePDF(laporanToPrint, true);
      } else if (reportType === "bulanan") {
        await generatePDFBulanan(laporanToPrint, true);
      } else if (reportType === "tersier") {
        await generatePDFTersier(laporanToPrint, true);
      }
      
      toast.success("Laporan PDF berhasil dibuat.");
      onClose();
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error("Gagal membuat laporan PDF: " + (error.message || JSON.stringify(error)));
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Cetak Laporan Drainase ({reportType === "harian" ? "Harian" : reportType === "bulanan" ? "Bulanan" : "Tersier"})</DialogTitle>
          <DialogDescription>
            Pilih kegiatan yang ingin Anda sertakan dalam laporan PDF.
            {reportType === "bulanan" && filterPeriod && <span className="font-semibold"> (Periode: {filterPeriod})</span>}
            {(reportType === "bulanan" || reportType === "tersier") && (
              <p className="text-red-500 text-xs mt-1">
                Catatan: Laporan {reportType} akan menggabungkan semua kegiatan yang dipilih dalam satu dokumen.
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
            <div className="flex-1 overflow-y-auto pr-4">
              <div className="space-y-3">
                {allKegiatans.map((kegiatan) => {
                  const isSelected = selectedKegiatanIds.has(kegiatan.id);
                  // Display details from the first aktifitasPenangananDetail for summary
                  const firstDetail = kegiatan.aktifitasPenangananDetails[0];
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
                        {firstDetail && (
                          <p className="text-sm text-muted-foreground">
                            {firstDetail.aktifitasPenanganan} ({kegiatan.tanggalKegiatan})
                          </p>
                        )}
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