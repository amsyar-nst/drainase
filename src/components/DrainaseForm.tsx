import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CalendarIcon, Plus, Trash2, FileText, Eye, Save, List, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { LaporanDrainase, KegiatanDrainase, Material, Peralatan } from "@/types/laporan";
import { kecamatanKelurahanData, koordinatorOptions, satuanOptions, materialDefaultUnits } from "@/data/kecamatan-kelurahan";
import { toast } from "sonner";
import { generatePDF } from "@/lib/pdf-generator";
import { supabase } from "@/integrations/supabase/client";

export const DrainaseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LaporanDrainase>({
    tanggal: new Date(),
    kegiatans: [{
      id: "1",
      namaJalan: "",
      kecamatan: "",
      kelurahan: "",
      foto0: null,
      foto50: null,
      foto100: null,
      jenisSaluran: "",
      jenisSedimen: "",
      aktifitasPenanganan: "",
      panjangPenanganan: "",
      lebarRataRata: "",
      rataRataSedimen: "",
      volumeGalian: "",
      materials: [{ id: "1", jenis: "", jumlah: "", satuan: "M³" }],
      peralatans: [{ id: "1", nama: "", jumlah: 1 }],
      koordinator: "",
      jumlahPHL: 1,
      keterangan: "",
    }]
  });

  const [currentKegiatanIndex, setCurrentKegiatanIndex] = useState(0);
  const [selectedKecamatan, setSelectedKecamatan] = useState("");
  const [kelurahanOptions, setKelurahanOptions] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [laporanId, setLaporanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentKegiatan = formData.kegiatans[currentKegiatanIndex];

  useEffect(() => {
    if (id) {
      loadLaporan(id);
    }
  }, [id]);

  const loadLaporan = async (laporanId: string) => {
    setIsLoading(true);
    try {
      // Fetch laporan
      const { data: laporanData, error: laporanError } = await supabase
        .from('laporan_drainase')
        .select('*')
        .eq('id', laporanId)
        .single();

      if (laporanError) throw laporanError;
      if (!laporanData) {
        toast.error('Laporan tidak ditemukan');
        navigate('/laporan');
        return;
      }

      setLaporanId(laporanId);

      // Fetch kegiatan
      const { data: kegiatanData, error: kegiatanError } = await supabase
        .from('kegiatan_drainase')
        .select('*')
        .eq('laporan_id', laporanId);

      if (kegiatanError) throw kegiatanError;

      // Load kegiatan with materials and peralatan
      const kegiatansWithDetails = await Promise.all(
        (kegiatanData || []).map(async (kegiatan) => {
          const [materialsRes, peralatanRes] = await Promise.all([
            supabase.from('material_kegiatan').select('*').eq('kegiatan_id', kegiatan.id),
            supabase.from('peralatan_kegiatan').select('*').eq('kegiatan_id', kegiatan.id)
          ]);

          return {
            id: kegiatan.id,
            namaJalan: kegiatan.nama_jalan,
            kecamatan: kegiatan.kecamatan,
            kelurahan: kegiatan.kelurahan,
            foto0: kegiatan.foto_0_url || null,
            foto50: kegiatan.foto_50_url || null,
            foto100: kegiatan.foto_100_url || null,
            foto0Url: kegiatan.foto_0_url || undefined,
            foto50Url: kegiatan.foto_50_url || undefined,
            foto100Url: kegiatan.foto_100_url || undefined,
            jenisSaluran: (kegiatan.jenis_saluran || "") as "" | "Terbuka" | "Tertutup",
            jenisSedimen: (kegiatan.jenis_sedimen || "") as "" | "Padat" | "Cair" | "Padat & Cair",
            aktifitasPenanganan: kegiatan.aktifitas_penanganan || "",
            panjangPenanganan: kegiatan.panjang_penanganan || "",
            lebarRataRata: kegiatan.lebar_rata_rata || "",
            rataRataSedimen: kegiatan.rata_rata_sedimen || "",
            volumeGalian: kegiatan.volume_galian || "",
            materials: (materialsRes.data || []).map(m => ({
              id: m.id,
              jenis: m.jenis,
              jumlah: m.jumlah,
              satuan: m.satuan
            })),
            peralatans: (peralatanRes.data || []).map(p => ({
              id: p.id,
              nama: p.nama,
              jumlah: p.jumlah
            })),
            koordinator: kegiatan.koordinator || "",
            jumlahPHL: kegiatan.jumlah_phl || 1,
            keterangan: kegiatan.keterangan || "",
          };
        })
      );

      setFormData({
        tanggal: new Date(laporanData.tanggal),
        kegiatans: kegiatansWithDetails.length > 0 ? kegiatansWithDetails : formData.kegiatans
      });

      toast.success('Laporan berhasil dimuat');
    } catch (error) {
      console.error('Error loading laporan:', error);
      toast.error('Gagal memuat laporan');
    } finally {
      setIsLoading(false);
    }
  };

  const updateCurrentKegiatan = (updates: Partial<KegiatanDrainase>) => {
    const newKegiatans = [...formData.kegiatans];
    newKegiatans[currentKegiatanIndex] = { ...currentKegiatan, ...updates };
    setFormData({ ...formData, kegiatans: newKegiatans });
  };

  const addKegiatan = () => {
    const newKegiatan: KegiatanDrainase = {
      id: Date.now().toString(),
      namaJalan: "",
      kecamatan: "",
      kelurahan: "",
      foto0: null,
      foto50: null,
      foto100: null,
      jenisSaluran: "",
      jenisSedimen: "",
      aktifitasPenanganan: "",
      panjangPenanganan: "",
      lebarRataRata: "",
      rataRataSedimen: "",
      volumeGalian: "",
      materials: [{ id: "1", jenis: "", jumlah: "", satuan: "M³" }],
      peralatans: [{ id: "1", nama: "", jumlah: 1 }],
      koordinator: "",
      jumlahPHL: 1,
      keterangan: "",
    };
    setFormData({ ...formData, kegiatans: [...formData.kegiatans, newKegiatan] });
    setCurrentKegiatanIndex(formData.kegiatans.length);
  };

  const removeKegiatan = (index: number) => {
    if (formData.kegiatans.length > 1) {
      const newKegiatans = formData.kegiatans.filter((_, i) => i !== index);
      setFormData({ ...formData, kegiatans: newKegiatans });
      if (currentKegiatanIndex >= newKegiatans.length) {
        setCurrentKegiatanIndex(newKegiatans.length - 1);
      }
    }
  };

  const handleKecamatanChange = (value: string) => {
    setSelectedKecamatan(value);
    const kecData = kecamatanKelurahanData.find((k) => k.kecamatan === value);
    if (kecData) {
      setKelurahanOptions(kecData.kelurahan);
      updateCurrentKegiatan({ kecamatan: value, kelurahan: "" });
    }
  };

  const handleKelurahanChange = (value: string) => {
    updateCurrentKegiatan({ kelurahan: value });
  };

  const addMaterial = () => {
    const newMaterial: Material = {
      id: Date.now().toString(),
      jenis: "",
      jumlah: "",
      satuan: "M³",
    };
    updateCurrentKegiatan({
      materials: [...currentKegiatan.materials, newMaterial],
    });
  };

  const removeMaterial = (id: string) => {
    if (currentKegiatan.materials.length > 1) {
      updateCurrentKegiatan({
        materials: currentKegiatan.materials.filter((m) => m.id !== id),
      });
    }
  };

  const updateMaterial = (id: string, field: keyof Material, value: string) => {
    updateCurrentKegiatan({
      materials: currentKegiatan.materials.map((m) => {
        if (m.id === id) {
          const updatedMaterial = { ...m, [field]: value };
          
          // Auto-fill satuan when jenis changes
          if (field === "jenis" && value) {
            const normalizedJenis = value.toLowerCase().trim();
            const defaultUnit = materialDefaultUnits[normalizedJenis];
            if (defaultUnit) {
              updatedMaterial.satuan = defaultUnit;
            }
          }
          
          return updatedMaterial;
        }
        return m;
      }),
    });
  };

  const addPeralatan = () => {
    const newPeralatan: Peralatan = {
      id: Date.now().toString(),
      nama: "",
      jumlah: 1,
    };
    updateCurrentKegiatan({
      peralatans: [...currentKegiatan.peralatans, newPeralatan],
    });
  };

  const removePeralatan = (id: string) => {
    if (currentKegiatan.peralatans.length > 1) {
      updateCurrentKegiatan({
        peralatans: currentKegiatan.peralatans.filter((p) => p.id !== id),
      });
    }
  };

  const updatePeralatan = (id: string, field: keyof Peralatan, value: string | number) => {
    updateCurrentKegiatan({
      peralatans: currentKegiatan.peralatans.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    });
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('laporan-photos')
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('laporan-photos')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Gagal mengunggah file');
      return null;
    }
  };

  const handlePreview = async () => {
    try {
      const blob = await generatePDF(formData, false);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Gagal membuat preview PDF');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let currentLaporanId = laporanId;

      if (currentLaporanId) {
        // Update existing laporan
        const { error: updateError } = await supabase
          .from('laporan_drainase')
          .update({
            tanggal: format(formData.tanggal, 'yyyy-MM-dd'),
            periode: format(formData.tanggal, 'MMMM yyyy', { locale: idLocale }),
          })
          .eq('id', currentLaporanId);

        if (updateError) throw updateError;

        // Delete existing kegiatan, materials, and peralatan
        const { error: deleteError } = await supabase
          .from('kegiatan_drainase')
          .delete()
          .eq('laporan_id', currentLaporanId);

        if (deleteError) throw deleteError;
      } else {
        // Create new laporan
        const { data: laporanData, error: laporanError } = await supabase
          .from('laporan_drainase')
          .insert({
            tanggal: format(formData.tanggal, 'yyyy-MM-dd'),
            periode: format(formData.tanggal, 'MMMM yyyy', { locale: idLocale }),
          })
          .select()
          .single();

        if (laporanError) throw laporanError;
        currentLaporanId = laporanData.id;
        setLaporanId(currentLaporanId);
      }

      // Save kegiatan
      for (const kegiatan of formData.kegiatans) {
        // Upload photos
        const foto0Url = kegiatan.foto0 
          ? (typeof kegiatan.foto0 === 'string' ? kegiatan.foto0 : await uploadFile(kegiatan.foto0, `${currentLaporanId}/${kegiatan.id}/foto0.jpg`))
          : (kegiatan.foto0Url || null);
        const foto50Url = kegiatan.foto50 
          ? (typeof kegiatan.foto50 === 'string' ? kegiatan.foto50 : await uploadFile(kegiatan.foto50, `${currentLaporanId}/${kegiatan.id}/foto50.jpg`))
          : (kegiatan.foto50Url || null);
        const foto100Url = kegiatan.foto100 
          ? (typeof kegiatan.foto100 === 'string' ? kegiatan.foto100 : await uploadFile(kegiatan.foto100, `${currentLaporanId}/${kegiatan.id}/foto100.jpg`))
          : (kegiatan.foto100Url || null);

        // Insert kegiatan
        const { data: kegiatanData, error: kegiatanError } = await supabase
          .from('kegiatan_drainase')
          .insert({
            laporan_id: currentLaporanId,
            nama_jalan: kegiatan.namaJalan,
            kecamatan: kegiatan.kecamatan,
            kelurahan: kegiatan.kelurahan,
            foto_0_url: foto0Url,
            foto_50_url: foto50Url,
            foto_100_url: foto100Url,
            jenis_saluran: kegiatan.jenisSaluran,
            jenis_sedimen: kegiatan.jenisSedimen,
            aktifitas_penanganan: kegiatan.aktifitasPenanganan,
            panjang_penanganan: kegiatan.panjangPenanganan,
            lebar_rata_rata: kegiatan.lebarRataRata,
            rata_rata_sedimen: kegiatan.rataRataSedimen,
            volume_galian: kegiatan.volumeGalian,
            koordinator: kegiatan.koordinator,
            jumlah_phl: kegiatan.jumlahPHL,
            keterangan: kegiatan.keterangan,
          })
          .select()
          .single();

        if (kegiatanError) throw kegiatanError;

        // Insert materials
        const materialsToInsert = kegiatan.materials.map(m => ({
          kegiatan_id: kegiatanData.id,
          jenis: m.jenis,
          jumlah: m.jumlah,
          satuan: m.satuan,
        }));

        const { error: materialsError } = await supabase
          .from('material_kegiatan')
          .insert(materialsToInsert);

        if (materialsError) throw materialsError;

        // Insert peralatan
        const peralatanToInsert = kegiatan.peralatans.map(p => ({
          kegiatan_id: kegiatanData.id,
          nama: p.nama,
          jumlah: p.jumlah,
        }));

        const { error: peralatanError } = await supabase
          .from('peralatan_kegiatan')
          .insert(peralatanToInsert);

        if (peralatanError) throw peralatanError;
      }

      toast.success(laporanId ? 'Laporan berhasil diperbarui' : 'Laporan berhasil disimpan');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Gagal menyimpan laporan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    try {
      await generatePDF(formData, true);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Gagal mendownload PDF');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="text-center space-y-2 flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Form Laporan Drainase
            </h1>
            <p className="text-muted-foreground">
              {id ? 'Edit laporan kegiatan drainase' : 'Isi formulir dengan lengkap untuk menghasilkan laporan'}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/laporan')} className="gap-2">
            <List className="h-4 w-4" />
            Lihat Laporan
          </Button>
        </div>

        {/* Activity Navigation */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {formData.kegiatans.map((_, index) => (
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
            {formData.kegiatans.length > 1 && (
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

        <Card className="p-6 space-y-6">
          {/* Tanggal */}
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

          {/* Lokasi */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nama-jalan">Nama Jalan</Label>
              <Input
                id="nama-jalan"
                value={currentKegiatan.namaJalan}
                onChange={(e) => updateCurrentKegiatan({ namaJalan: e.target.value })}
                placeholder="Masukkan nama jalan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kecamatan">Kecamatan</Label>
              <Select value={currentKegiatan.kecamatan} onValueChange={handleKecamatanChange}>
                <SelectTrigger id="kecamatan">
                  <SelectValue placeholder="Pilih kecamatan" />
                </SelectTrigger>
                <SelectContent>
                  {kecamatanKelurahanData.map((item) => (
                    <SelectItem key={item.kecamatan} value={item.kecamatan}>
                      {item.kecamatan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kelurahan">Kelurahan</Label>
              <Select
                value={currentKegiatan.kelurahan}
                onValueChange={handleKelurahanChange}
                disabled={!kelurahanOptions.length}
              >
                <SelectTrigger id="kelurahan">
                  <SelectValue placeholder="Pilih kelurahan" />
                </SelectTrigger>
                <SelectContent>
                  {kelurahanOptions.map((kel) => (
                    <SelectItem key={kel} value={kel}>
                      {kel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Photos */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="foto-0">Foto 0%</Label>
              <Input
                id="foto-0"
                type="file"
                accept="image/*"
                onChange={(e) => updateCurrentKegiatan({ foto0: e.target.files?.[0] || null })}
              />
              {(currentKegiatan.foto0 || currentKegiatan.foto0Url) && (
                <div className="mt-2">
                  <img 
                    src={
                      currentKegiatan.foto0 instanceof File 
                        ? URL.createObjectURL(currentKegiatan.foto0)
                        : currentKegiatan.foto0Url || ''
                    } 
                    alt="Foto 0%" 
                    className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                    onClick={() => {
                      const url = currentKegiatan.foto0 instanceof File 
                        ? URL.createObjectURL(currentKegiatan.foto0)
                        : currentKegiatan.foto0Url || '';
                      setPreviewUrl(url);
                      setShowPreview(true);
                    }}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="foto-50">Foto 50%</Label>
              <Input
                id="foto-50"
                type="file"
                accept="image/*"
                onChange={(e) => updateCurrentKegiatan({ foto50: e.target.files?.[0] || null })}
              />
              {(currentKegiatan.foto50 || currentKegiatan.foto50Url) && (
                <div className="mt-2">
                  <img 
                    src={
                      currentKegiatan.foto50 instanceof File 
                        ? URL.createObjectURL(currentKegiatan.foto50)
                        : currentKegiatan.foto50Url || ''
                    } 
                    alt="Foto 50%" 
                    className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                    onClick={() => {
                      const url = currentKegiatan.foto50 instanceof File 
                        ? URL.createObjectURL(currentKegiatan.foto50)
                        : currentKegiatan.foto50Url || '';
                      setPreviewUrl(url);
                      setShowPreview(true);
                    }}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="foto-100">Foto 100%</Label>
              <Input
                id="foto-100"
                type="file"
                accept="image/*"
                onChange={(e) => updateCurrentKegiatan({ foto100: e.target.files?.[0] || null })}
              />
              {(currentKegiatan.foto100 || currentKegiatan.foto100Url) && (
                <div className="mt-2">
                  <img 
                    src={
                      currentKegiatan.foto100 instanceof File 
                        ? URL.createObjectURL(currentKegiatan.foto100)
                        : currentKegiatan.foto100Url || ''
                    } 
                    alt="Foto 100%" 
                    className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                    onClick={() => {
                      const url = currentKegiatan.foto100 instanceof File 
                        ? URL.createObjectURL(currentKegiatan.foto100)
                        : currentKegiatan.foto100Url || '';
                      setPreviewUrl(url);
                      setShowPreview(true);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Jenis Saluran & Sedimen */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jenis-saluran">Jenis Saluran</Label>
              <Select
                value={currentKegiatan.jenisSaluran}
                onValueChange={(value) => updateCurrentKegiatan({ jenisSaluran: value as "Terbuka" | "Tertutup" | "" })}
              >
                <SelectTrigger id="jenis-saluran">
                  <SelectValue placeholder="Pilih jenis saluran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Terbuka">Terbuka</SelectItem>
                  <SelectItem value="Tertutup">Tertutup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jenis-sedimen">Jenis Sedimen</Label>
              <Select
                value={currentKegiatan.jenisSedimen}
                onValueChange={(value) => updateCurrentKegiatan({ jenisSedimen: value as "Padat" | "Cair" | "Padat & Cair" | "" })}
              >
                <SelectTrigger id="jenis-sedimen">
                  <SelectValue placeholder="Pilih jenis sedimen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Padat">Padat</SelectItem>
                  <SelectItem value="Cair">Cair</SelectItem>
                  <SelectItem value="Padat & Cair">Padat & Cair</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Aktifitas & Measurements */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aktifitas">Aktifitas Penanganan</Label>
              <Input
                id="aktifitas"
                value={currentKegiatan.aktifitasPenanganan}
                onChange={(e) => updateCurrentKegiatan({ aktifitasPenanganan: e.target.value })}
                placeholder="Contoh: Pembersihan dan Pengerukan"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="panjang">Panjang Penanganan (M)</Label>
                <Input
                  id="panjang"
                  value={currentKegiatan.panjangPenanganan}
                  onChange={(e) => updateCurrentKegiatan({ panjangPenanganan: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lebar">Lebar Rata-rata (M)</Label>
                <Input
                  id="lebar"
                  value={currentKegiatan.lebarRataRata}
                  onChange={(e) => updateCurrentKegiatan({ lebarRataRata: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sedimen">Tinggi Rata-rata Sedimen (M)</Label>
                <Input
                  id="sedimen"
                  value={currentKegiatan.rataRataSedimen}
                  onChange={(e) => updateCurrentKegiatan({ rataRataSedimen: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="volume">Volume Galian (M³)</Label>
                <Input
                  id="volume"
                  value={currentKegiatan.volumeGalian}
                  onChange={(e) => updateCurrentKegiatan({ volumeGalian: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Materials */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Material yang Digunakan</Label>
              <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
                <Plus className="h-4 w-4 mr-1" />
                Tambah
              </Button>
            </div>
            {currentKegiatan.materials.map((material) => (
              <div key={material.id} className="grid gap-4 md:grid-cols-4 items-end">
                <div className="space-y-2">
                  <Label>Jenis Material</Label>
                  <Input
                    value={material.jenis}
                    onChange={(e) => updateMaterial(material.id, "jenis", e.target.value)}
                    placeholder="Contoh: Pasir"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jumlah</Label>
                  <Input
                    value={material.jumlah}
                    onChange={(e) => updateMaterial(material.id, "jumlah", e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Satuan</Label>
                  <Select
                    value={material.satuan}
                    onValueChange={(value) => updateMaterial(material.id, "satuan", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {satuanOptions.map((satuan) => (
                        <SelectItem key={satuan} value={satuan}>
                          {satuan}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeMaterial(material.id)}
                  disabled={currentKegiatan.materials.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Peralatan */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Peralatan yang Digunakan</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPeralatan}>
                <Plus className="h-4 w-4 mr-1" />
                Tambah
              </Button>
            </div>
            {currentKegiatan.peralatans.map((peralatan) => (
              <div key={peralatan.id} className="grid gap-4 md:grid-cols-3 items-end">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nama Peralatan</Label>
                  <Input
                    value={peralatan.nama}
                    onChange={(e) => updatePeralatan(peralatan.id, "nama", e.target.value)}
                    placeholder="Contoh: Excavator"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jumlah</Label>
                  <Input
                    type="number"
                    min="1"
                    value={peralatan.jumlah}
                    onChange={(e) => updatePeralatan(peralatan.id, "jumlah", parseInt(e.target.value) || 1)}
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removePeralatan(peralatan.id)}
                  disabled={currentKegiatan.peralatans.length === 1}
                  className="md:col-start-3"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Koordinator & PHL */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="koordinator">Koordinator</Label>
              <Select
                value={currentKegiatan.koordinator}
                onValueChange={(value) => updateCurrentKegiatan({ koordinator: value })}
              >
                <SelectTrigger id="koordinator">
                  <SelectValue placeholder="Pilih koordinator" />
                </SelectTrigger>
                <SelectContent>
                  {koordinatorOptions.map((koordinator) => (
                    <SelectItem key={koordinator} value={koordinator}>
                      {koordinator}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jumlah-phl">Jumlah PHL</Label>
              <Input
                id="jumlah-phl"
                type="number"
                min="1"
                value={currentKegiatan.jumlahPHL}
                onChange={(e) => updateCurrentKegiatan({ jumlahPHL: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          {/* Keterangan */}
          <div className="space-y-2">
            <Label htmlFor="keterangan">Keterangan</Label>
            <Textarea
              id="keterangan"
              value={currentKegiatan.keterangan}
              onChange={(e) => updateCurrentKegiatan({ keterangan: e.target.value })}
              placeholder="Catatan tambahan (opsional)"
              rows={4}
            />
          </div>

          {/* Actions */}
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
        </Card>

        {/* Preview Dialog */}
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
      </div>
    </div>
  );
};