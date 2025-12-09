import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2, Edit, Plus, Printer, CalendarDays } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import DrainasePrintDialog from "@/components/DrainasePrintDialog"; // Import the new dialog

interface LaporanItem {
  id: string;
  tanggal: string;
  periode: string;
  created_at: string;
  kegiatan_count: number;
  report_type: "harian" | "bulanan" | "tersier"; // Include report_type
}

// Define a type for the period data
interface PeriodData {
  periode: string;
}

const LaporanList = () => {
  const [laporans, setLaporans] = useState<LaporanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // States for the new DrainasePrintDialog
  const [isDrainasePrintDialogOpen, setIsDrainasePrintDialogOpen] = useState(false);
  const [laporanIdsToPrint, setLaporanIdsToPrint] = useState<string[]>([]);
  const [currentPrintReportType, setCurrentPrintReportType] = useState<"harian" | "bulanan" | "tersier">("harian"); // Added "tersier"

  // New states for period filtering
  const [uniquePeriods, setUniquePeriods] = useState<string[]>([]);
  const [selectedFilterPeriod, setSelectedFilterPeriod] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchLaporans = async (filterPeriod: string | null = null) => {
    setLoading(true);
    try {
      // 1. Fetch main laporan data
      let laporanQuery = supabase
        .from("laporan_drainase")
        .select("*")
        .order("tanggal", { ascending: false });

      if (filterPeriod) {
        laporanQuery = laporanQuery.eq("periode", filterPeriod);
      }

      const { data: laporanData, error: laporanError } = await laporanQuery;

      if (laporanError) {
        console.error("Supabase Error fetching main laporans:", laporanError);
        toast.error("Gagal memuat laporan utama: " + laporanError.message);
        setLaporans([]); // Reset laporans on error
        setUniquePeriods([]); // Reset periods on error
        return; // Exit early
      }

      // 2. Fetch all periods and deduplicate client-side for the filter dropdown
      const { data: allPeriodsData, error: allPeriodsError } = await supabase
        .from("laporan_drainase")
        .select("periode")
        .order("periode", { ascending: false });

      if (allPeriodsError) {
        console.error("Supabase Error fetching all periods:", allPeriodsError);
        toast.error("Gagal memuat semua periode: " + allPeriodsError.message);
        setUniquePeriods([]); // Reset periods on error
        return; // Exit early
      }

      // Deduplicate periods client-side
      const uniquePeriodsSet = new Set((allPeriodsData || []).map((p: PeriodData) => p.periode as string));
      setUniquePeriods(Array.from(uniquePeriodsSet));

      // 3. Fetch kegiatan count for each laporan
      const laporansWithCount = await Promise.all(
        (laporanData || []).map(async (laporan) => {
          const { count, error: countError } = await supabase
            .from("kegiatan_drainase")
            .select("*", { count: "exact", head: true })
            .eq("laporan_id", laporan.id);

          if (countError) {
            console.warn(`Warning: Could not fetch kegiatan count for laporan ${laporan.id}:`, countError);
            // Jangan lempar error di sini agar laporan lain tetap bisa dimuat
          }

          return {
            ...laporan,
            kegiatan_count: count || 0,
            report_type: laporan.report_type as "harian" | "bulanan" | "tersier",
          };
        })
      );

      setLaporans(laporansWithCount);

    } catch (error: any) {
      console.error("Error in fetchLaporans:", error);
      toast.error("Gagal memuat data laporan: " + (error.message || "Terjadi kesalahan tidak dikenal."));
      setLaporans([]); // Reset laporans on any error
      setUniquePeriods([]); // Reset periods on any error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporans(selectedFilterPeriod);
  }, [selectedFilterPeriod]); // Re-fetch when filter period changes

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
      fetchLaporans(selectedFilterPeriod); // Re-fetch with current filter
    } catch (error) {
      console.error("Error deleting laporan:", error);
      toast.error("Gagal menghapus laporan");
    } finally {
      setDeleteId(null);
    }
  };

  const handleIndividualPrintClick = (laporanId: string, type: "harian" | "tersier") => {
    setLaporanIdsToPrint([laporanId]);
    setCurrentPrintReportType(type);
    setIsDrainasePrintDialogOpen(true);
  };

  const handleGlobalPrintSelection = (reportType: "harian" | "bulanan" | "tersier") => {
    setCurrentPrintReportType(reportType);
    if (reportType === "harian" || reportType === "tersier") {
      // For global harian/tersier, fetch all laporans matching the current filter period AND report_type
      const allFilteredLaporanIds = laporans
        .filter(l => l.report_type === reportType)
        .map(l => l.id);
      setLaporanIdsToPrint(allFilteredLaporanIds);
    } else if (reportType === "bulanan") {
      // For bulanan, we will pass the filterPeriod to the dialog, and it will fetch all harian laporans for that period
      setLaporanIdsToPrint([]); // Empty array, dialog will fetch based on filterPeriod
    }
    setIsDrainasePrintDialogOpen(true);
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
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
            <div>
              <CardTitle className="text-2xl">Daftar Laporan Drainase</CardTitle>
              <CardDescription>Kelola laporan kegiatan drainase yang telah disimpan</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button onClick={() => navigate("/drainase/new")} className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Buat Laporan Baru
              </Button>

              {/* New Periode Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 w-full sm:w-auto">
                    <CalendarDays className="h-4 w-4" />
                    {selectedFilterPeriod ? selectedFilterPeriod : "Periode"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Pilih Periode</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedFilterPeriod(null)}>
                    Tampilkan Semua
                  </DropdownMenuItem>
                  {uniquePeriods.map((period) => (
                    <DropdownMenuItem key={period} onClick={() => setSelectedFilterPeriod(period)}>
                      {period}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 w-full sm:w-auto">
                    <Printer className="h-4 w-4" />
                    Cetak
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleGlobalPrintSelection("harian")}>
                    Laporan Harian
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleGlobalPrintSelection("bulanan")}>
                    Laporan Bulanan
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleGlobalPrintSelection("tersier")}>
                    Laporan Tersier
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            {laporans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Belum ada laporan tersimpan</p>
                <Button onClick={() => navigate("/drainase/new")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Buat Laporan Pertama
                </Button>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Tanggal</TableHead>
                      <TableHead className="min-w-[100px]">Jenis Laporan</TableHead> {/* New column */}
                      <TableHead className="min-w-[150px] hidden md:table-cell">Periode</TableHead>
                      <TableHead className="min-w-[150px] hidden md:table-cell">Jumlah Kegiatan</TableHead>
                      <TableHead className="min-w-[180px] hidden md:table-cell">Dibuat</TableHead>
                      <TableHead className="text-right min-w-[120px] md:min-w-[240px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {laporans.map((laporan) => (
                      <TableRow key={laporan.id}>
                        <TableCell className="font-medium">
                          {format(new Date(laporan.tanggal), "dd MMMM yyyy", { locale: idLocale })}
                        </TableCell>
                        <TableCell className="capitalize">{laporan.report_type}</TableCell> {/* Display report type */}
                        <TableCell className="hidden md:table-cell">{laporan.periode}</TableCell>
                        <TableCell className="hidden md:table-cell">{laporan.kegiatan_count} kegiatan</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {format(new Date(laporan.created_at), "dd MMM yyyy HH:mm", { locale: idLocale })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleIndividualPrintClick(laporan.id, laporan.report_type === "tersier" ? "tersier" : "harian")}
                              className="md:size-sm md:w-auto"
                            >
                              <Printer className="h-4 w-4 md:mr-2" />
                              <span className="hidden md:inline">Cetak</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => navigate(`/drainase/edit/${laporan.id}`)}
                              className="md:size-sm md:w-auto"
                            >
                              <Edit className="h-4 w-4 md:mr-2" />
                              <span className="hidden md:inline">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setDeleteId(laporan.id)}
                              className="text-destructive hover:text-destructive md:size-sm md:w-auto"
                            >
                              <Trash2 className="h-4 w-4 md:mr-2" />
                              <span className="hidden md:inline">Hapus</span>
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

        {/* New DrainasePrintDialog */}
        <DrainasePrintDialog
          isOpen={isDrainasePrintDialogOpen}
          onClose={() => setIsDrainasePrintDialogOpen(false)}
          laporanIdsToFetch={laporanIdsToPrint}
          reportType={currentPrintReportType}
          filterPeriod={currentPrintReportType === "bulanan" ? selectedFilterPeriod : null}
        />
      </div>
    </>
  );
};

export default LaporanList;