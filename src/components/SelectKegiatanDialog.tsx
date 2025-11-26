import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KegiatanDrainase, LaporanDrainase, Material, Peralatan, OperasionalAlatBerat } from "@/types/laporan";
import { generatePDF } from "@/lib/pdf-generator";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface SelectKegiatanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  laporanId: string | null;
  laporanTanggal: Date | null;
}

const SelectKegiatanDialog: React.FC<SelectKegiatanDialogProps> = ({
  isOpen,
  onClose,
  laporanId,
  laporanTanggal,
}) => {
  const [kegiatans, setKegiatans] = useState<KegiatanDrainase[]>([]);
  const [selectedKegiatanIds, setSelectedKegiatanIds] = new Set<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && laporanId) {
      fetchKegiatans(laporanId);
    } else {
      setKegiatans([]);
      setSelectedKegiatanIds(new Set());
    }
  }, [isOpen, laporanId]);

  const fetchKegiatans = async (id: string) => {
    setLoading(true);
    try {
      const { data: kegiatanData, error: kegiatanError } = await supabase
        .from('kegiatan_drainase')
        .select('*')
        .eq('laporan_id', id)
        .order('created_at', { ascending: true });

      if (kegiatanError) throw kegiatanError;

      const kegiatansWithDetails = await Promise.all(
        (kegiatanData || []).map(async (kegiatan) => {
          const [materialsRes, peralatanRes, operasionalAlatBeratRes] = await Promise.all([
            supabase.from('material_kegiatan').select('*').eq('kegiatan_id', kegiatan.id),
            supabase.from('peralatan_kegiatan').select('*').eq('kegiatan_id', kegiatan.id),
            supabase.from('operasional_alat_berat_kegiatan').select('*').eq('kegiatan_id', kegiatan.id)
          ]);

          return {
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
            operasionalAlatBerats: (operasionalAlatBeratRes.data || []).map(o => ({
              id: o.id,
              jenis: o.jenis,
              jumlah: o.jumlah,
            })),
            koordinator: (kegiatan.koordinator || []) as string[],
            jumlahPHL: kegiatan.jumlah_phl || 1,
            keterangan: kegiatan.keterangan || "",
          };
        })
      );
      setKegiatans(kegiatansWithDetails);
      setSelectedKegiatanIds(new Set(kegiatansWithDetails.map(k => k.id))); // Select all by default
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Gagal memuat daftar kegiatan.");
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
      setSelectedKegiatanIds(new Set(kegiatans.map(k => k.id)));
    } else {
      setSelectedKegiatanIds(new Set());
    }
  };

  const handleGeneratePdf = async (downloadNow: boolean) => {
    if (!laporanTanggal) {
      toast.error("Tanggal laporan tidak tersedia.");
      return;
    }
    if (selectedKegiatanIds.size === 0) {
      toast.error("Pilih setidaknya satu kegiatan untuk dicetak/diunduh.");
      return;
    }

    const selectedActivities = kegiatans.filter(kegiatan =>
      selectedKegiatanIds.has(kegiatan.id)
    );

    const laporanDataForPdf: LaporanDrainase = {
      tanggal: laporanTanggal,
      kegiatans: selectedActivities, // This will be overridden by kegiatansToRender
    };

    try {
      await generatePDF(laporanDataForPdf, downloadNow, selectedActivities);
      toast.success(downloadNow ? "PDF berhasil diunduh." : "PDF siap dicetak.");
      onClose();
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Gagal membuat PDF.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pilih Kegiatan untuk Dicetak/Diunduh</DialogTitle>
          <DialogDescription>
            Pilih kegiatan drainase yang ingin Anda sertakan dalam laporan PDF.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <p className="text-muted-foreground">Memuat kegiatan...</p>
          </div>
        ) : kegiatans.length === 0 ? (
          <div className="flex justify-center items-center h-48">
            <p className="text-muted-foreground">Tidak ada kegiatan ditemukan untuk laporan ini.</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b pb-2">
                <Checkbox
                  id="select-all"
                  checked={selectedKegiatanIds.size === kegiatans.length && kegiatans.length > 0}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                />
                <Label htmlFor="select-all" className="font-semibold">
                  Pilih Semua Kegiatan
                </Label>
              </div>
              {kegiatans.map((kegiatan, index) => (
                <div key={kegiatan.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={`kegiatan-${kegiatan.id}`}
                    checked={selectedKegiatanIds.has(kegiatan.id)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(kegiatan.id, checked as boolean)
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor={`kegiatan-${kegiatan.id}`} className="font-medium">
                      Kegiatan {index + 1}: {kegiatan.namaJalan}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {kegiatan.kelurahan}, {kegiatan.kecamatan} - {kegiatan.aktifitasPenanganan}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={() => handleGeneratePdf(true)} disabled={selectedKegiatanIds.size === 0}>
            Cetak/Unduh PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SelectKegiatanDialog;