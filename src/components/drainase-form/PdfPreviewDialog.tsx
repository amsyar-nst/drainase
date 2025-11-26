import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PdfPreviewDialogProps {
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
  previewUrl: string | null;
}

export const PdfPreviewDialog: React.FC<PdfPreviewDialogProps> = ({
  showPreview,
  setShowPreview,
  previewUrl,
}) => {
  return (
    <Dialog open={showPreview} onOpenChange={setShowPreview}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Preview PDF</DialogTitle>
          <DialogDescription>
            Preview laporan sebelum download
          </DialogDescription>
        </DialogHeader>
        {previewUrl && (
          <iframe
            src={previewUrl}
            className="w-full h-[70vh] border rounded"
            title="PDF Preview"
          />
        )}
      </DialogContent>
    </Dialog>
  );
};