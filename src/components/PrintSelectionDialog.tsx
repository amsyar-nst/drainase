import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PrintSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReportType: (type: "harian" | "bulanan" | "tersier", action: "preview" | "download") => void;
  actionType: "preview" | "download"; // Untuk membedakan antara aksi pratinjau dan unduh
  currentFormType: "drainase" | "tersier" | "list"; // Untuk mengetahui dari form mana dialog ini dibuka
}

export const PrintSelectionDialog: React.FC<PrintSelectionDialogProps> = ({
  isOpen,
  onClose,
  onSelectReportType,
  actionType,
  currentFormType,
}) => {
  const handleSelection = (type: "harian" | "bulanan" | "tersier") => {
    // These checks are mostly for safety, as buttons will be conditionally rendered
    if (currentFormType === "drainase" && type === "tersier") {
      toast.error("Laporan Tersier tidak dapat dibuat dari Form Drainase.");
      return;
    }
    if (currentFormType === "tersier" && (type === "harian" || type === "bulanan")) {
      toast.error("Laporan Harian/Bulanan tidak dapat dibuat dari Form Drainase Tersier.");
      return;
    }
    onSelectReportType(type, actionType);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pilih Jenis Laporan</DialogTitle>
          <DialogDescription>
            Pilih jenis laporan yang ingin Anda {actionType === "preview" ? "pratinjau" : "cetak/unduh"}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {currentFormType === "drainase" && (
            <Button onClick={() => handleSelection("harian")}>Laporan Harian</Button>
          )}
          {currentFormType === "tersier" && (
            <Button onClick={() => handleSelection("tersier")}>Laporan Tersier</Button>
          )}
          {/* If currentFormType is 'list' (not currently used by this dialog, but for completeness) */}
          {currentFormType === "list" && (
            <>
              <Button onClick={() => handleSelection("harian")}>Laporan Harian</Button>
              <Button onClick={() => handleSelection("bulanan")}>Laporan Bulanan</Button>
              <Button onClick={() => handleSelection("tersier")}>Laporan Tersier</Button>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};