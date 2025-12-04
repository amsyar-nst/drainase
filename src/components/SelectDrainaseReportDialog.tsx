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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface SelectDrainaseReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (laporanId: string) => void;
  reportType: "harian" | "bulanan"; // Indicates which type of report is being selected
}

interface LaporanItem {
  id: string;
  tanggal: string;
  periode: string;
}

export const SelectDrainaseReportDialog: React.FC<SelectDrainaseReportDialogProps> = ({
  isOpen,
  onClose,
  onSelect,
  reportType,
}) => {
  const [laporans, setLaporans] = useState<LaporanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLaporanId, setSelectedLaporanId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLaporans();
    } else {
      setLaporans([]);
      setSelectedLaporanId(null);
    }
  }, [isOpen]);

  const fetchLaporans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("laporan_drainase")
        .select("id, tanggal, periode")
        .order("tanggal", { ascending: false });

      if (error) throw error;
      setLaporans(data || []);
    } catch (error) {
      console.error("Error fetching drainase reports:", error);
      toast.error("Gagal memuat daftar laporan drainase.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAndClose = () => {
    if (selectedLaporanId) {
      onSelect(selectedLaporanId);
      onClose();
    } else {
      toast.error("Mohon pilih salah satu laporan.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pilih Laporan Drainase ({reportType === "harian" ? "Harian" : "Bulanan"})</DialogTitle>
          <DialogDescription>
            Pilih laporan drainase yang ingin Anda cetak.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Memuat laporan...</span>
          </div>
        ) : laporans.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Tidak ada laporan drainase yang tersedia.</p>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            <RadioGroup
              value={selectedLaporanId || ""}
              onValueChange={setSelectedLaporanId}
              className="space-y-3"
            >
              {laporans.map((laporan) => (
                <div key={laporan.id} className="flex items-center space-x-2 border-b pb-2 last:border-b-0">
                  <RadioGroupItem value={laporan.id} id={`laporan-${laporan.id}`} />
                  <Label htmlFor={`laporan-${laporan.id}`} className="grid gap-1.5 leading-none flex-1">
                    <span className="font-medium text-base">
                      {format(new Date(laporan.tanggal), "dd MMMM yyyy", { locale: idLocale })}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Periode: {laporan.periode}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </ScrollArea>
        )}
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleSelectAndClose} disabled={!selectedLaporanId || loading}>
            Pilih & Cetak
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};