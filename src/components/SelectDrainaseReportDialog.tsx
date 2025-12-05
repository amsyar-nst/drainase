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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils"; // Import cn for conditional classNames

interface SelectDrainaseReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (laporanIds: string[]) => void;
  reportType: "harian" | "bulanan";
  filterPeriod: string | null;
}

interface LaporanItem {
  id: string;
  tanggal: string;
  periode: string;
  aktifitas_penanganan_summary: string;
}

const SelectDrainaseReportDialog: React.FC<SelectDrainaseReportDialogProps> = ({
  isOpen,
  onClose,
  onSelect,
  reportType,
  filterPeriod,
}) => {
  const [laporans, setLaporans] = useState<LaporanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLaporanIds, setSelectedLaporanIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      fetchLaporans();
    } else {
      setLaporans([]);
      setSelectedLaporanIds(new Set());
    }
  }, [isOpen, filterPeriod]);

  const fetchLaporans = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("laporan_drainase")
        .select(`
          id,
          tanggal,
          periode,
          kegiatan_drainase(aktifitas_penanganan)
        `)
        .order("tanggal", { ascending: false });

      if (filterPeriod) {
        query = query.eq("periode", filterPeriod);
      }

      const { data, error } = await query;

      if (error) throw error;

      const processedLaporans: LaporanItem[] = (data || []).map((laporan) => {
        const activities = (laporan.kegiatan_drainase || [])
          .map((k: any) => k.aktifitas_penanganan)
          .filter(Boolean)
          .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);

        let aktifitas_penanganan_summary = "";
        if (activities.length === 1) {
          aktifitas_penanganan_summary = activities[0];
        } else if (activities.length > 1) {
          aktifitas_penanganan_summary = `${activities[0]} dan ${activities.length - 1} lainnya`;
        } else {
          aktifitas_penanganan_summary = "Tidak ada aktivitas";
        }

        return {
          id: laporan.id,
          tanggal: laporan.tanggal,
          periode: laporan.periode,
          aktifitas_penanganan_summary,
        };
      });

      console.log("Fetched Laporans for SelectDrainaseReportDialog:", processedLaporans); // Debug log
      setLaporans(processedLaporans);
    } catch (error) {
      console.error("Error fetching drainase reports:", error);
      toast.error("Gagal memuat daftar laporan drainase.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (laporanId: string, checked: boolean) => {
    setSelectedLaporanIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(laporanId);
      } else {
        newSet.delete(laporanId);
      }
      console.log(`Checkbox for ${laporanId} changed to ${checked}. Current selected IDs:`, newSet); // Debug log
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLaporanIds(new Set(laporans.map(l => l.id)));
    } else {
      setSelectedLaporanIds(new Set());
    }
    console.log(`Select All changed to ${checked}. Current selected IDs:`, selectedLaporanIds); // Debug log
  };

  const handleSelectAndClose = () => {
    if (selectedLaporanIds.size > 0) {
      onSelect(Array.from(selectedLaporanIds));
      onClose();
    } else {
      toast.error("Mohon pilih setidaknya satu laporan.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pilih Laporan Drainase ({reportType === "harian" ? "Harian" : "Bulanan"})</DialogTitle>
          <DialogDescription>
            Pilih laporan drainase yang ingin Anda cetak.
            {filterPeriod && <span className="font-semibold"> (Periode: {filterPeriod})</span>}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Memuat laporan...</span>
          </div>
        ) : laporans.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Tidak ada laporan drainase yang tersedia untuk periode ini.</p>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center space-x-2 my-4">
              <Checkbox
                id="select-all-laporans"
                checked={selectedLaporanIds.size === laporans.length && laporans.length > 0}
                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                disabled={laporans.length === 0}
              />
              <Label htmlFor="select-all-laporans" className="font-semibold">
                Pilih Semua ({selectedLaporanIds.size}/{laporans.length})
              </Label>
            </div>
            <ScrollArea className="max-h-[calc(90vh-150px)] pr-4"> {/* Adjusted max-h */}
              <div className="space-y-3">
                {laporans.map((laporan) => {
                  const isSelected = selectedLaporanIds.has(laporan.id);
                  return (
                    <div
                      key={laporan.id}
                      className={cn(
                        "flex items-start space-x-2 border-b pb-2 last:border-b-0 p-2 rounded-md cursor-pointer",
                        "hover:bg-muted/50 transition-colors",
                        isSelected && "bg-primary/10" // Highlight selected items
                      )}
                      onClick={() => handleCheckboxChange(laporan.id, !isSelected)}
                    >
                      <Checkbox
                        id={`laporan-${laporan.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(laporan.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={`laporan-${laporan.id}`} className="grid gap-1.5 leading-none flex-1 cursor-pointer">
                        <span className="font-medium text-base">
                          {format(new Date(laporan.tanggal), "dd MMMM yyyy", { locale: idLocale })}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Aktivitas Penanganan: {laporan.aktifitas_penanganan_summary}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Periode: {laporan.periode}
                        </span>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleSelectAndClose} disabled={selectedLaporanIds.size === 0 || loading}>
            Pilih & Cetak
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SelectDrainaseReportDialog;