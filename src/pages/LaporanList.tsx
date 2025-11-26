import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Trash2, Edit, Plus, Printer, FileDown } from "lucide-react";
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
import SelectKegiatanDialog from "@/components/SelectKegiatanDialog"; // Import the new dialog

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
  const [isSelectKegiatanDialogOpen, setIsSelectKegiatanDialogOpen] = useState(false);
  const [selectedLaporanForPdf, setSelectedLaporanForPdf] = useState<{ id: string; tanggal: Date } | null>(null);
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
      // Delete related materials, peralatan, and operasional_alat_berat first (due to foreign key constraints)
      const { data: kegiatanIds, error: fetchKegiatanError } = await supabase
        .from("kegiatan_drainase")
        .select("id")
        .eq("laporan_id", id);

      if (fetchKegiatanError) throw fetchKegiatanError;

      if (kegiatanIds && kegiatanIds.length > 0) {
        const idsToDelete = kegiatanIds.map(k => k.id);
        
        const { error: materialError } = await supabase
          .from("material_kegiatan")
          .delete()
          .in("kegiatan_id", idsToDelete);
        if (materialError) throw materialError;

        const { error: peralatanError } = await supabase
          .from("peralatan_kegiatan")
          .delete()
          .in("kegiatan_id", idsToDelete);
        if (peralatanError) throw peralatanError;

        const { error: operasionalAlatBeratError } = await supabase // New delete
          .from("operasional_alat_berat_kegiatan")
          .delete()
          .in("kegiatan_id", idsToDelete);
        if (operasionalAlatBeratError) throw operasionalAlatBeratError;

        // Then delete kegiatans
        const { error: kegiatanError } = await supabase
          .from("kegiatan_drainase")
          .delete()
          .eq("laporan_id", id);
        if (kegiatanError) throw kegiatanError;
      }

      // Finally, delete laporan
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

  const handleOpenSelectKegiatanDialog = (laporanId: string, tanggal: string) => {
    setSelectedLaporanForPdf({ id: laporanId, tanggal: new Date(tanggal) });
    setIsSelectKegiatanDialogOpen(true);
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
                              onClick={() => handleOpenSelectKegiatanDialog(laporan.id, laporan.tanggal)}
                              className="gap-2"
                            >
                              <Printer className="h-4 w-4" />
                              Cetak/Unduh
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
                Semua kegiatan, material, peralatan, dan operasional alat berat yang terkait dengan laporan ini juga akan dihapus.
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

        {selectedLaporanForPdf && (
          <SelectKegiatanDialog
            isOpen={isSelectKegiatanDialogOpen}
            onClose={() => setIsSelectKegiatanDialogOpen(false)}
            laporanId={selectedLaporanForPdf.id}
            laporanTanggal={selectedLaporanForPdf.tanggal}
          />
        )}
      </div>
    </>
  );
};

export default LaporanList;