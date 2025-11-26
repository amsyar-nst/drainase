import React from "react";
import { Button } from "@/components/ui/button";
import { Eye, Save, Download } from "lucide-react";

interface FormActionsProps {
  handlePreview: () => void;
  handleSave: () => Promise<void>;
  handleDownload: () => Promise<void>;
  isSaving: boolean;
}

export const FormActions: React.FC<FormActionsProps> = ({
  handlePreview,
  handleSave,
  handleDownload,
  isSaving,
}) => {
  return (
    <div className="flex gap-4 pt-4">
      <Button onClick={handlePreview} variant="outline" className="flex-1">
        <Eye className="mr-2 h-4 w-4" />
        Preview PDF
      </Button>
      <Button onClick={handleSave} disabled={isSaving} className="flex-1">
        {isSaving ? (
          <>Menyimpan...</>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Simpan
          </>
        )}
      </Button>
      <Button onClick={handleDownload} variant="default" className="flex-1">
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
    </div>
  );
};