import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, FileText, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Navigation } from "@/components/Navigation";

interface LaporanItem {
  id: string;
  bulan: string;
  created_at: string;
  kegiatan_count: number;
}

const TersierList = () => {
  const navigate = useNavigate();
  const [laporans, setLaporans] = useState<LaporanItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLaporans();
  }, []);

  const loadLaporans = async () => {
    try {
      const { data, error } = await supabase
        .from("laporan_drainase_tersier")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const laporansWithCount = await Promise.all(
        data.map(async (laporan) => {
          const { count } = await supabase
            .from("kegiatan_drainase_tersier")
            .select("*", { count: "exact", head: true })
            .eq("laporan_id", laporan.id);

          return {
            id: laporan.id,
            bulan: laporan.bulan,
            created_at: laporan.created_at,
            kegiatan_count: count || 0,
          };
        })
      );

      setLaporans(laporansWithCount);
    } catch (error) {
      console.error("Error loading laporans:", error);
      toast.error("Gagal memuat daftar laporan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Delete related kegiatans first
      const { error: kegiatanError } = await supabase
        .from("kegiatan_drainase_tersier")
        .delete()
        .eq("laporan_id", id);

      if (kegiatanError) throw kegiatanError;

      // Delete laporan
      const { error: laporanError } = await supabase
        .from("laporan_drainase_tersier")
        .delete()
        .eq("id", id);

      if (laporanError) throw laporanError;

      toast.success("Laporan berhasil dihapus");
      loadLaporans();
    } catch (error) {
      console.error("Error deleting laporan:", error);
      toast.error("Gagal menghapus laporan");
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Daftar Laporan Drainase Tersier
            </h1>
            <p className="text-muted-foreground mt-2">
              Kelola semua laporan pemeliharaan drainase tersier
            </p>
          </div>
          <Button onClick={() => navigate("/tersier")}>
            <Plus className="mr-2 h-4 w-4" />
            Buat Laporan Baru
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Memuat data...
            </CardContent>
          </Card>
        ) : laporans.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Belum ada laporan tersier yang dibuat
              </p>
              <Button onClick={() => navigate("/tersier")}>
                <Plus className="mr-2 h-4 w-4" />
                Buat Laporan Pertama
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {laporans.map((laporan) => (
              <Card key={laporan.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {laporan.bulan}
                  </CardTitle>
                  <CardDescription>
                    {laporan.kegiatan_count} kegiatan •{" "}
                    {new Date(laporan.created_at).toLocaleDateString("id-ID")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/tersier/edit/${laporan.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Lihat
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Laporan?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Semua data kegiatan
                            dalam laporan ini akan dihapus permanen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(laporan.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default TersierList;
