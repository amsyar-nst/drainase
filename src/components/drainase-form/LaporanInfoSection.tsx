import React from "react";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { LaporanDrainase } from "@/types/laporan";

interface LaporanInfoSectionProps {
  formData: LaporanDrainase;
  setFormData: React.Dispatch<React.SetStateAction<LaporanDrainase>>;
}

export const LaporanInfoSection: React.FC<LaporanInfoSectionProps> = ({ formData, setFormData }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="tanggal">Tanggal</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="tanggal"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !formData.tanggal && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formData.tanggal ? format(formData.tanggal, "PPP", { locale: idLocale }) : "Pilih tanggal"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={formData.tanggal}
            onSelect={(date) => date && setFormData({ ...formData, tanggal: date })}
            initialFocus
            locale={idLocale}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};