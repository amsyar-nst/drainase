import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, Save, Download, List, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LaporanDrainaseTersier, KegiatanDrainaseTersier, Alat } from "@/types/laporan-tersier";
import { kecamatanKelurahanData, koordinatorOptions } from "@/data/kecamatan-kelurahan";
import { toast } from "sonner";
import { generatePDFTersier } from "@/lib/pdf-generator-tersier";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const bulanOptions = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const jenisSedimenOptions = [
  "Padat",
  "Sedang",
  "Cair",
  "Sedang dan Cair",
  "Padat dan Cair"
];

const alatOptions = [
  "Cangkul",
  "Sekop",
  "Dump Truck",
  "Backhoe Loader",
  "Excavator",
  "Wheelbarrow",
  "Linggis",
  "Ember"
];

export const DrainaseTersierForm = () => {
  const navigate = useNavigate();
  const { id: laporanId } = useParams();

  const [laporan, setLaporan] = useState<LaporanDrainaseTersier>({
    bulan: "",
    kegiatans: [],
  });

  const [currentKegiatanIndex, setCurrentKegiatanIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [kelurahanOptions, setKelurahanOptions] = useState<string[]>([]);
  const [customSedimen, setCustomSedimen] = useState("");
  const [selectedAlat, setSelectedAlat] = useState<string[]>([]);
  const [alatJumlah, setAlatJumlah] = useState<Record<string, number>>({});
  const [selectedPenanggungJawab, setSelectedPenanggungJawab] = useState<string[]>([]);

  const emptyKegiatan: KegiatanDrainaseTersier = {
    id: crypto.randomUUID(),
    hariTanggal: new Date(),
    namaJalan: "",
    kecamatan: "",
    kelurahan: "",
    kota: "Kota Medan",
    jenisSedimen: "",
    alatYangDibutuhkan: [],
    useUpt: false,
    uptCount: 0,
    useP3su: false,
    p3suCount: 0,
    rencanaPanjang: "",
    rencanaVolume: "",
    realisasiPanjang: "",
    realisasiVolume: "",
    sisaTargetHari: "",
    penanggungjawab: [],
    keterangan: "",
  };

  const [currentKegiatan, setCurrentKegiatan] = useState<KegiatanDrainaseTersier>(emptyKegiatan);

  useEffect(() => {
    if (laporanId) {
      loadLaporan(laporanId);
    }
  }, [laporanId]);

  const loadLaporan = async (id: string) => {
    try {
      const { data: laporanData, error: laporanError } = await supabase
        .from("laporan_drainase_tersier")
        .select("*")
        .eq("id", id)
        .single();

      if (laporanError) throw laporanError;

      const { data: kegiatanData, error: kegiatanError } = await supabase
        .from("kegiatan_drainase_tersier")
        .select("*")
        .eq("laporan_id", id)
        .order("created_at");

      if (kegiatanError) throw kegiatanError;

      const kegiatans: KegiatanDrainaseTersier[] = kegiatanData.map((k: any) => {
        const lokasi = k.lokasi || "";
        const lokasiParts = lokasi.split(", ");
        
        let alatArray: Alat[] = [];
        if (k.alat_yang_dibutuhkan) {
          if (Array.isArray(k.alat_yang_dibutuhkan) && k.alat_yang_dibutuhkan.length > 0) {
            if (typeof k.alat_yang_dibutuhkan[0] === 'object') {
              alatArray = k.alat_yang_dibutuhkan as Alat[];
            } else {
              alatArray = (k.alat_yang_dibutuhkan as string[]).map(nama => ({ nama, jumlah: 1 }));
            }
          }
        }

        let penanggungjawabArray: string[] = [];
        if (k.penanggungjawab) {
          if (typeof k.penanggungjawab === 'string') {
            penanggungjawabArray = k.penanggungjawab.split(', ');
          } else if (Array.isArray(k.penanggungjawab)) {
            penanggungjawabArray = k.penanggungjawab;
          }
        }

        return {
          id: k.id,
          hariTanggal: new Date(k.hari_tanggal),
          namaJalan: lokasiParts[0] || "",
          kecamatan: lokasiParts[1] || "",
          kelurahan: lokasiParts[2] || "",
          kota: lokasiParts[3] || "Kota Medan",
          jenisSedimen: k.jenis_sedimen || "",
          alatYangDibutuhkan: alatArray,
          useUpt: (k.kebutuhan_tenaga_kerja || 0) > 0,
          uptCount: k.kebutuhan_tenaga_kerja || 0,
          useP3su: false,
          p3suCount: 0,
          rencanaPanjang: k.panjang || "",
          rencanaVolume: k.volume || "",
          realisasiPanjang: k.panjang || "",
          realisasiVolume: k.volume || "",
          sisaTargetHari: k.sisa_target || "",
          penanggungjawab: penanggungjawabArray,
          keterangan: k.keterangan || "",
        };
      });

      setLaporan({
        bulan: laporanData.bulan,
        kegiatans,
      });
    } catch (error: any) {
      console.error("Error loading laporan:", error);
      toast.error("Gagal memuat data laporan");
    }
  };

  const handleKecamatanChange = (kecamatan: string) => {
    setCurrentKegiatan({ ...currentKegiatan, kecamatan, kelurahan: "" });
    const selected = kecamatanKelurahanData.find((k) => k.kecamatan === kecamatan);
    setKelurahanOptions(selected?.kelurahan || []);
  };

  const toggleAlat = (namaAlat: string) => {
    if (selectedAlat.includes(namaAlat)) {
      setSelectedAlat(selectedAlat.filter(a => a !== namaAlat));
      const newJumlah = { ...alatJumlah };
      delete newJumlah[namaAlat];
      setAlatJumlah(newJumlah);
    } else {
      setSelectedAlat([...selectedAlat, namaAlat]);
      setAlatJumlah({ ...alatJumlah, [namaAlat]: 1 });
    }
  };

  const updateAlatJumlah = (namaAlat: string, jumlah: number) => {
    setAlatJumlah({ ...alatJumlah, [namaAlat]: jumlah });
  };

  const togglePenanggungJawab = (nama: string) => {
    if (selectedPenanggungJawab.includes(nama)) {
      setSelectedPenanggungJawab(selectedPenanggungJawab.filter(p => p !== nama));
    } else {
      setSelectedPenanggungJawab([...selectedPenanggungJawab, nama]);
    }
  };

  const addKegiatan = () => {
    const alatArray: Alat[] = selectedAlat.map(nama => ({
      nama,
      jumlah: alatJumlah[nama] || 1
    }));

    const newKegiatan = {
      ...currentKegiatan,
      alatYangDibutuhkan: alatArray,
      penanggungjawab: selectedPenanggungJawab,
    };

    setLaporan({
      ...laporan,
      kegiatans: [...laporan.kegiatans, newKegiatan],
    });

    setCurrentKegiatan(emptyKegiatan);
    setSelectedAlat([]);
    setAlatJumlah({});
    setSelectedPenanggungJawab([]);
    toast.success("Kegiatan ditambahkan");
  };

  const editKegiatan = (index: number) => {
    const kegiatan = laporan.kegiatans[index];
    setCurrentKegiatan(kegiatan);
    setCurrentKegiatanIndex(index);
    setIsEditing(true);
    
    const selected = kecamatanKelurahanData.find((k) => k.kecamatan === kegiatan.kecamatan);
    setKelurahanOptions(selected?.kelurahan || []);

    const alatNames = kegiatan.alatYangDibutuhkan.map(a => a.nama);
    setSelectedAlat(alatNames);
    const jumlahMap: Record<string, number> = {};
    kegiatan.alatYangDibutuhkan.forEach(a => {
      jumlahMap[a.nama] = a.jumlah;
    });
    setAlatJumlah(jumlahMap);

    setSelectedPenanggungJawab(kegiatan.penanggungjawab);
  };

  const updateKegiatan = () => {
    if (currentKegiatanIndex === null) return;

    const alatArray: Alat[] = selectedAlat.map(nama => ({
      nama,
      jumlah: alatJumlah[nama] || 1
    }));

    const updatedKegiatan = {
      ...currentKegiatan,
      alatYangDibutuhkan: alatArray,
      penanggungjawab: selectedPenanggungJawab,
    };

    const updatedKegiatans = [...laporan.kegiatans];
    updatedKegiatans[currentKegiatanIndex] = updatedKegiatan;

    setLaporan({
      ...laporan,
      kegiatans: updatedKegiatans,
    });

    setCurrentKegiatan(emptyKegiatan);
    setCurrentKegiatanIndex(null);
    setIsEditing(false);
    setSelectedAlat([]);
    setAlatJumlah({});
    setSelectedPenanggungJawab([]);
    toast.success("Kegiatan diperbarui");
  };

  const deleteKegiatan = (index: number) => {
    const updatedKegiatans = laporan.kegiatans.filter((_, i) => i !== index);
    setLaporan({
      ...laporan,
      kegiatans: updatedKegiatans,
    });
    toast.success("Kegiatan dihapus");
  };

  const cancelEdit = () => {
    setCurrentKegiatan(emptyKegiatan);
    setCurrentKegiatanIndex(null);
    setIsEditing(false);
    setSelectedAlat([]);
    setAlatJumlah({});
    setSelectedPenanggungJawab([]);
  };

  const handleSave = async () => {
    if (!laporan.bulan) {
      toast.error("Mohon isi bulan laporan");
      return;
    }

    if (laporan.kegiatans.length === 0) {
      toast.error("Mohon tambahkan minimal satu kegiatan");
      return;
    }

    try {
      let savedLaporanId = laporanId;

      if (laporanId) {
        const { error: updateError } = await supabase
          .from("laporan_drainase_tersier")
          .update({ bulan: laporan.bulan })
          .eq("id", laporanId);

        if (updateError) throw updateError;

        const { error: deleteError } = await supabase
          .from("kegiatan_drainase_tersier")
          .delete()
          .eq("laporan_id", laporanId);

        if (deleteError) throw deleteError;
      } else {
        const { data: newLaporan, error: insertError } = await supabase
          .from("laporan_drainase_tersier")
          .insert({ bulan: laporan.bulan })
          .select()
          .single();

        if (insertError) throw insertError;
        savedLaporanId = newLaporan.id;
      }

      const kegiatanInserts = laporan.kegiatans.map((kegiatan) => ({
        laporan_id: savedLaporanId!,
        hari_tanggal: format(kegiatan.hariTanggal, "yyyy-MM-dd"),
        lokasi: `${kegiatan.namaJalan}, ${kegiatan.kecamatan}, ${kegiatan.kelurahan}, ${kegiatan.kota}`,
        jenis_sedimen: kegiatan.jenisSedimen,
        alat_yang_dibutuhkan: kegiatan.alatYangDibutuhkan.map(a => a.nama),
        kebutuhan_tenaga_kerja: kegiatan.useUpt ? kegiatan.uptCount : 0,
        panjang: kegiatan.rencanaPanjang,
        volume: kegiatan.rencanaVolume,
        sisa_target: kegiatan.sisaTargetHari,
        penanggungjawab: kegiatan.penanggungjawab.join(", "),
        keterangan: kegiatan.keterangan,
      }));

      const { error: kegiatanError } = await supabase
        .from("kegiatan_drainase_tersier")
        .insert(kegiatanInserts);

      if (kegiatanError) throw kegiatanError;

      toast.success("Laporan berhasil disimpan");
      navigate("/tersier/list");
    } catch (error: any) {
      console.error("Error saving:", error);
      toast.error("Gagal menyimpan laporan: " + error.message);
    }
  };

  const handleDownload = () => {
    if (!laporan.bulan) {
      toast.error("Mohon isi bulan laporan");
      return;
    }

    if (laporan.kegiatans.length === 0) {
      toast.error("Mohon tambahkan minimal satu kegiatan");
      return;
    }

    generatePDFTersier(laporan);
    toast.success("PDF berhasil diunduh");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Form Laporan Drainase Tersier</h1>
            <p className="text-muted-foreground mt-2">Kelola kegiatan pembersihan drainase tersier</p>
          </div>
          <Button
            onClick={() => navigate("/tersier/list")}
            variant="outline"
            className="gap-2"
          >
            <List className="h-4 w-4" />
            Lihat Daftar Laporan
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Laporan</CardTitle>
            <CardDescription>Masukkan bulan laporan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bulan">Bulan</Label>
                <Select
                  value={laporan.bulan}
                  onValueChange={(value) => setLaporan({ ...laporan, bulan: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Bulan" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {bulanOptions.map((bulan) => (
                      <SelectItem key={bulan} value={bulan}>
                        {bulan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Kegiatan" : "Tambah Kegiatan"}</CardTitle>
            <CardDescription>Isi detail kegiatan drainase tersier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Hari/Tanggal */}
              <div>
                <Label>Hari/Tanggal</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !currentKegiatan.hariTanggal && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentKegiatan.hariTanggal
                        ? format(currentKegiatan.hariTanggal, "PPP", { locale: id })
                        : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background z-50">
                    <Calendar
                      mode="single"
                      selected={currentKegiatan.hariTanggal}
                      onSelect={(date) =>
                        setCurrentKegiatan({
                          ...currentKegiatan,
                          hariTanggal: date || new Date(),
                        })
                      }
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Lokasi Section */}
              <div className="space-y-4 border rounded-lg p-4">
                <h3 className="font-semibold text-lg">Lokasi</h3>
                
                <div>
                  <Label htmlFor="namaJalan">Nama Jalan</Label>
                  <Input
                    id="namaJalan"
                    value={currentKegiatan.namaJalan}
                    onChange={(e) =>
                      setCurrentKegiatan({ ...currentKegiatan, namaJalan: e.target.value })
                    }
                    placeholder="Masukkan nama jalan"
                  />
                </div>

                <div>
                  <Label htmlFor="kecamatan">Kecamatan</Label>
                  <Select
                    value={currentKegiatan.kecamatan}
                    onValueChange={handleKecamatanChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kecamatan" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {kecamatanKelurahanData.map((item) => (
                        <SelectItem key={item.kecamatan} value={item.kecamatan}>
                          {item.kecamatan}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="kelurahan">Kelurahan</Label>
                  <Select
                    value={currentKegiatan.kelurahan}
                    onValueChange={(value) =>
                      setCurrentKegiatan({ ...currentKegiatan, kelurahan: value })
                    }
                    disabled={!currentKegiatan.kecamatan}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kelurahan" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {kelurahanOptions.map((kelurahan) => (
                        <SelectItem key={kelurahan} value={kelurahan}>
                          {kelurahan}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="kota">Kota</Label>
                  <Input
                    id="kota"
                    value={currentKegiatan.kota}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* Jenis Sedimen */}
              <div>
                <Label htmlFor="jenisSedimen">Jenis Sedimen</Label>
                <Select
                  value={currentKegiatan.jenisSedimen}
                  onValueChange={(value) => {
                    setCurrentKegiatan({ ...currentKegiatan, jenisSedimen: value });
                    setCustomSedimen("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Jenis Sedimen" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {jenisSedimenOptions.map((jenis) => (
                      <SelectItem key={jenis} value={jenis}>
                        {jenis}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
                {currentKegiatan.jenisSedimen === "custom" && (
                  <Input
                    type="text"
                    placeholder="Masukkan jenis sedimen"
                    value={customSedimen}
                    onChange={(e) => {
                      setCustomSedimen(e.target.value);
                      setCurrentKegiatan({ ...currentKegiatan, jenisSedimen: e.target.value });
                    }}
                    className="mt-2"
                  />
                )}
              </div>

              {/* Kebutuhan Tenaga Kerja */}
              <div className="space-y-2 border rounded-lg p-4">
                <h3 className="font-semibold text-lg">Kebutuhan Tenaga Kerja</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="upt"
                    checked={currentKegiatan.useUpt}
                    onCheckedChange={(checked) =>
                      setCurrentKegiatan({ ...currentKegiatan, useUpt: checked || false, uptCount: 0 })
                    }
                  />
                  <Label htmlFor="upt">UPT</Label>
                  {currentKegiatan.useUpt && (
                    <Input
                      type="number"
                      placeholder="Jumlah"
                      value={currentKegiatan.uptCount.toString()}
                      onChange={(e) =>
                        setCurrentKegiatan({
                          ...currentKegiatan,
                          uptCount: parseInt(e.target.value),
                        })
                      }
                      className="w-24"
                    />
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="p3su"
                    checked={currentKegiatan.useP3su}
                    onCheckedChange={(checked) =>
                      setCurrentKegiatan({ ...currentKegiatan, useP3su: checked || false, p3suCount: 0 })
                    }
                  />
                  <Label htmlFor="p3su">P3SU</Label>
                  {currentKegiatan.useP3su && (
                    <Input
                      type="number"
                      placeholder="Jumlah"
                      value={currentKegiatan.p3suCount.toString()}
                      onChange={(e) =>
                        setCurrentKegiatan({
                          ...currentKegiatan,
                          p3suCount: parseInt(e.target.value),
                        })
                      }
                      className="w-24"
                    />
                  )}
                </div>
              </div>

              {/* Alat yang Dibutuhkan */}
              <div className="space-y-2 border rounded-lg p-4">
                <h3 className="font-semibold text-lg">Alat yang Dibutuhkan</h3>
                {alatOptions.map((alat) => (
                  <div key={alat} className="flex items-center space-x-2">
                    <Checkbox
                      id={alat}
                      checked={selectedAlat.includes(alat)}
                      onCheckedChange={() => toggleAlat(alat)}
                    />
                    <Label htmlFor={alat}>{alat}</Label>
                    {selectedAlat.includes(alat) && (
                      <Input
                        type="number"
                        placeholder="Jumlah"
                        value={alatJumlah[alat]?.toString() || "1"}
                        onChange={(e) => updateAlatJumlah(alat, parseInt(e.target.value))}
                        className="w-24"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Rencana Dimensi */}
              <div className="space-y-4 border rounded-lg p-4">
                <h3 className="font-semibold text-lg">Rencana Dimensi</h3>
                <div>
                  <Label htmlFor="rencanaPanjang">Panjang</Label>
                  <Input
                    id="rencanaPanjang"
                    placeholder="Masukkan panjang"
                    value={currentKegiatan.rencanaPanjang}
                    onChange={(e) =>
                      setCurrentKegiatan({ ...currentKegiatan, rencanaPanjang: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="rencanaVolume">Volume</Label>
                  <Input
                    id="rencanaVolume"
                    placeholder="Masukkan volume"
                    value={currentKegiatan.rencanaVolume}
                    onChange={(e) =>
                      setCurrentKegiatan({ ...currentKegiatan, rencanaVolume: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Realisasi Dimensi */}
              <div className="space-y-4 border rounded-lg p-4">
                <h3 className="font-semibold text-lg">Realisasi Dimensi</h3>
                <div>
                  <Label htmlFor="realisasiPanjang">Panjang</Label>
                  <Input
                    id="realisasiPanjang"
                    placeholder="Masukkan panjang"
                    value={currentKegiatan.realisasiPanjang}
                    onChange={(e) =>
                      setCurrentKegiatan({ ...currentKegiatan, realisasiPanjang: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="realisasiVolume">Volume</Label>
                  <Input
                    id="realisasiVolume"
                    placeholder="Masukkan volume"
                    value={currentKegiatan.realisasiVolume}
                    onChange={(e) =>
                      setCurrentKegiatan({ ...currentKegiatan, realisasiVolume: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Sisa Target */}
              <div>
                <Label htmlFor="sisaTargetHari">Sisa Target (Hari)</Label>
                <Input
                  id="sisaTargetHari"
                  placeholder="Berapa Hari"
                  value={currentKegiatan.sisaTargetHari}
                  onChange={(e) =>
                    setCurrentKegiatan({ ...currentKegiatan, sisaTargetHari: e.target.value })
                  }
                />
              </div>

              {/* Penanggung Jawab */}
              <div className="space-y-2 border rounded-lg p-4">
                <h3 className="font-semibold text-lg">Penanggung Jawab</h3>
                {koordinatorOptions.map((nama) => (
                  <div key={nama} className="flex items-center space-x-2">
                    <Checkbox
                      id={nama}
                      checked={selectedPenanggungJawab.includes(nama)}
                      onCheckedChange={() => togglePenanggungJawab(nama)}
                    />
                    <Label htmlFor={nama}>{nama}</Label>
                  </div>
                ))}
              </div>

              {/* Keterangan */}
              <div>
                <Label htmlFor="keterangan">Keterangan</Label>
                <Textarea
                  id="keterangan"
                  placeholder="Masukkan keterangan"
                  value={currentKegiatan.keterangan}
                  onChange={(e) =>
                    setCurrentKegiatan({ ...currentKegiatan, keterangan: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={updateKegiatan} className="flex-1">
                      <Save className="mr-2 h-4 w-4" />
                      Update Kegiatan
                    </Button>
                    <Button onClick={cancelEdit} variant="outline" className="flex-1">
                      <X className="mr-2 h-4 w-4" />
                      Batal
                    </Button>
                  </>
                ) : (
                  <Button onClick={addKegiatan} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Kegiatan
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listing Kegiatan */}
        {laporan.kegiatans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Daftar Kegiatan</CardTitle>
              <CardDescription>Berikut adalah daftar kegiatan yang telah ditambahkan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lokasi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jenis Sedimen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Alat yang Dibutuhkan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {laporan.kegiatans.map((kegiatan, index) => (
                      <tr key={kegiatan.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {format(kegiatan.hariTanggal, "dd/MM/yyyy")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {`${kegiatan.namaJalan}, ${kegiatan.kecamatan}, ${kegiatan.kelurahan}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{kegiatan.jenisSedimen}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {kegiatan.alatYangDibutuhkan.map((alat) => alat.nama).join(", ")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => editKegiatan(index)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteKegiatan(index)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Simpan Laporan
          </Button>
        </div>
      </div>
    </div>
  );
};
