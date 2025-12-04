import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Trash2, Edit, Plus, Printer } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Navigation } from "@/components/Navigation";
import { PrintSelectionDialog } from "@/components/PrintSelectionDialog"; // Import the new dialog component
import { generatePDF } from "@/lib/pdf-generator"; // Import generatePDF

interface LaporanItem {
  id: string;
  tanggal: string;
  periode: string;
  created_at: string;
  kegiatan_count: number;
}

const LaporanList = () => {
  const [laporans, setLaporans] = useState<LaporanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPrintSelectionDialogOpen, setIsPrintSelectionDialogOpen] = useState(false); // State for print selection dialog
  const [selectedLaporanIdForPrint, setSelectedLaporanIdForPrint] = useState<string | null>(null); // State for selected laporan to print
  const navigate = useNavigate();

  const fetchLaporans = async () => {
    try {
      setLoading(true);
      const { data: laporanData, error: laporanError } = await supabase
        .from("laporan_drainase")
        .select("*")
        .order("tanggal", { ascending: false });

      if (laporanError) throw laporanError;

      // Fetch kegiatan count for each laporan
      const laporansWithCount = await Promise.all(
        (laporanData || []).map(async (laporan) => {
          const { count } = await supabase
            .from("kegiatan_drainase")
            .select("*", { count: "exact", head: true })
            .eq("laporan_id", laporan.id);

          return {
            ...laporan,
            kegiatan_count: count || 0,
          };
        })
      );

      setLaporans(laporansWithCount);
    } catch (error) {
      console.error("Error fetching laporans:", error);
      toast.error("Gagal memuat data laporan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporans();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      // Delete kegiatan first (cascade should handle materials and peralatan)
      const { error: kegiatanError } = await supabase
        .from("kegiatan_drainase")
        .delete()
        .eq("laporan_id", id);

      if (kegiatanError) throw kegiatanError;

      // Delete laporan
      const { error: laporanError } = await supabase
        .from("laporan_drainase")
        .delete()
        .eq("id", id);

      if (laporanError) throw laporanError;

      toast.success("Laporan berhasil dihapus");
      fetchLaporans();
    } catch (error) {
      console.error("Error deleting laporan:", error);
      toast.error("Gagal menghapus laporan");
    } finally {
      setDeleteId(null);
    }
  };

  const handlePrintClick = (laporanId: string) => {
    setSelectedLaporanIdForPrint(laporanId);
    setIsPrintSelectionDialogOpen(true);
  };

  const handlePrintSelection = async (type: "harian" | "bulanan" | "tersier", action: "preview" | "download") => {
    if (!selectedLaporanIdForPrint) {
      toast.error("Tidak ada laporan yang dipilih untuk dicetak.");
      return;
    }

    if (type === "tersier") {
      toast.error("Laporan Tersier tidak dapat dicetak dari daftar laporan drainase utama.");
      return;
    }

    try {
      // Fetch full laporan data including all activities, materials, etc.
      const { data: laporanData, error: laporanError } = await supabase
        .from('laporan_drainase')
        .select('*')
        .eq('id', selectedLaporanIdForPrint)
        .single();

      if (laporanError) throw laporanError;
      if (!laporanData) {
        toast.error('Laporan tidak ditemukan.');
        return;
      }

      const { data: kegiatanData, error: kegiatanError } = await supabase
        .from('kegiatan_drainase')
        .select('*')
        .eq('laporan_id', selectedLaporanIdForPrint);

      if (kegiatanError) throw kegiatanError;

      const kegiatansWithDetails = await Promise.all(
        (kegiatanData || []).map(async (kegiatan) => {
          const [materialsRes, peralatanRes, operasionalRes] = await Promise.all([
            supabase.from('material_kegiatan').select('*').eq('kegiatan_id', kegiatan.id),
            supabase.from('peralatan_kegiatan').select('*').eq('kegiatan_id', kegiatan.id),
            supabase.from('operasional_alat_berat_kegiatan').select('*').eq('kegiatan_id', kegiatan.id)
          ]);

          const materials = (materialsRes.data || []).map(m => ({
            id: m.id,
            jenis: m.jenis,
            jumlah: m.jumlah,
            satuan: m.satuan,
            keterangan: m.keterangan || "",
          }));
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
            materials: materials,
            peralatans: peralatans,
            operasionalAlatBerats: operasionalAlatBerats,
            koordinator: kegiatan.koordinator || [],
            jumlahPHL: kegiatan.jumlah_phl || 1,
            keterangan: kegiatan.keterangan || "",
          };
        })
      );

      const fullLaporan = {
        tanggal: new Date(laporanData.tanggal),
        kegiatans: kegiatansWithDetails,
      };

      await generatePDF(fullLaporan, action === "download");
      toast.success(`Laporan ${type} berhasil di${action === "preview" ? "pratinjau" : "unduh"}.`);

    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error("Gagal membuat laporan PDF: " + error.message);
    } finally {
      setSelectedLaporanIdForPrint(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Memuat data...</p>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-2xl">Daftar Laporan Drainase</CardTitle>
              <CardDescription>Kelola laporan kegiatan drainase yang telah disimpan</CardDescription>
            </div>
            <Button onClick={() => navigate("/")} className="gap-2">
              <Plus className="h-4 w-4" />
              Buat Laporan Baru
            </Button>
          </CardHeader>
          <CardContent>
            {laporans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Belum ada laporan tersimpan</p>
                <Button onClick={() => navigate("/")}>Buat Laporan Pertama</Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Jumlah Kegiatan</TableHead>
                      <TableHead>Dibuat</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {laporans.map((laporan) => (
                      <TableRow key={laporan.id}>
                        <TableCell className="font-medium">
                          {format(new Date(laporan.tanggal), "dd MMMM yyyy", { locale: idLocale })}
                        </TableCell>
                        <TableCell>{laporan.periode}</TableCell>
                        <TableCell>{laporan.kegiatan_count} kegiatan</TableCell>
                        <TableCell>
                          {format(new Date(laporan.created_at), "dd MMM yyyy HH:mm", { locale: idLocale })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrintClick(laporan.id)}
                              className="gap-2"
                            >
                              <Printer className="h-4 w-4" />
                              Cetak
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/edit/${laporan.id}`)}
                              className="gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteId(laporan.id)}
                              className="gap-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              Hapus
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && handleDelete(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Print Selection Dialog */}
        <PrintSelectionDialog
          isOpen={isPrintSelectionDialogOpen}
          onClose={() => setIsPrintSelectionDialogOpen(false)}
          onSelectReportType={handlePrintSelection}
          actionType="download" // For list, assume "download" action for print button
          currentFormType="list"
        />
      </div>
    </>
  );
};

export default LaporanList;