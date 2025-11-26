import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { KegiatanDrainase } from "@/types/laporan";
import { Card } from "@/components/ui/card";

interface KegiatanNavigationProps {
  kegiatans: KegiatanDrainase[];
  currentKegiatanIndex: number;
  setCurrentKegiatanIndex: (index: number) => void;
  addKegiatan: () => void;
  removeKegiatan: (index: number) => void;
}

export const KegiatanNavigation: React.FC<KegiatanNavigationProps> = ({
  kegiatans,
  currentKegiatanIndex,
  setCurrentKegiatanIndex,
  addKegiatan,
  removeKegiatan,
}) => {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {kegiatans.map((_, index) => (
            <Button
              key={index}
              variant={currentKegiatanIndex === index ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentKegiatanIndex(index)}
            >
              Kegiatan {index + 1}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={addKegiatan}>
            <Plus className="h-4 w-4 mr-1" />
            Tambah
          </Button>
        </div>
        {kegiatans.length > 1 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => removeKegiatan(currentKegiatanIndex)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
};