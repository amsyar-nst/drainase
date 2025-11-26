import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { List } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { LaporanDrainase, KegiatanDrainase, Material, Peralatan } from "@/types/laporan";
import { kecamatanKelurahanData, materialDefaultUnits } from "@/data/kecamatan-kelurahan";
import { toast } from "sonner";
import { generatePDF } from "@/lib/pdf-generator";
import { supabase } from "@/integrations/supabase/client";
import { uploadImageToSupabaseStorage } from "@/lib/supabase-storage-upload";
import { compressImage } from "@/lib/image-compressor";

// Import modular components
import { LaporanInfoSection } from "./drainase-form/LaporanInfoSection";
import { KegiatanNavigation } from "./drainase-form/KegiatanNavigation";
import { KegiatanDetailsSection } from "./drainase-form/KegiatanDetailsSection";
import { PhotoUploadSection } from "./drainase-form/PhotoUploadSection";
import { JenisSaluranSedimenSection } from "./drainase-form/JenisSaluranSedimenSection";
import { ActivityMeasurementsSection } from "./drainase-form/ActivityMeasurementsSection";
import { MaterialsSection } from "./drainase-form/MaterialsSection";
import { PeralatanSection } from "./drainase-form/PeralatanSection";
import { KoordinatorPHLSection } from "./drainase-form/KoordinatorPHLSection";
import { KeteranganSection } from "./drainase-form/KeteranganSection";
import { FormActions } from "./drainase-form/FormActions";
import { PdfPreviewDialog } from "./drainase-form/PdfPreviewDialog";

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

  const updateCurrentKegiatan = useCallback((updates: Partial<KegiatanDrainase>) => {
    setFormData(prevData => {
      const newKegiatans = [...prevData.kegiatans];
      newKegiatans[currentKegiatanIndex] = { ...newKegiatans[currentKegiatanIndex], ...updates };
      return { ...prevData, kegiatans: newKegiatans };
    });
  }, [currentKegiatanIndex]);

  const loadLaporan = async (laporanId: string) => {
    setIsLoading(true);
    try {
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

      const { data: kegiatanData, error: kegiatanError } = await supabase
        .from('kegiatan_drainase')
        .select('*')
        .eq('laporan_id', laporanId);

      if (kegiatanError) throw kegiatanError;

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

  const addKegiatan = useCallback(() => {
    const newKegiatan: KegiatanDrainase = {
      id: "temp-" + Date.now().toString(),
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
    setFormData(prevData => ({ ...prevData, kegiatans: [...prevData.kegiatans, newKegiatan] }));
    setCurrentKegiatanIndex(formData.kegiatans.length);
  }, [formData.kegiatans.length]);

  const removeKegiatan = useCallback((index: number) => {
    if (formData.kegiatans.length > 1) {
      setFormData(prevData => {
        const newKegiatans = prevData.kegiatans.filter((_, i) => i !== index);
        if (currentKegiatanIndex >= newKegiatans.length) {
          setCurrentKegiatanIndex(newKegiatans.length - 1);
        }
        return { ...prevData, kegiatans: newKegiatans };
      });
    }
  }, [formData.kegiatans.length, currentKegiatanIndex]);

  const handleKecamatanChange = useCallback((value: string) => {
    setSelectedKecamatan(value);
    const kecData = kecamatanKelurahanData.find((k) => k.kecamatan === value);
    if (kecData) {
      setKelurahanOptions(kecData.kelurahan);
      updateCurrentKegiatan({ kecamatan: value, kelurahan: "" });
    }
  }, [updateCurrentKegiatan]);

  const handleKelurahanChange = useCallback((value: string) => {
    updateCurrentKegiatan({ kelurahan: value });
  }, [updateCurrentKegiatan]);

  const uploadFile = useCallback(async (file: File, laporanId: string, kegiatanId: string, type: string): Promise<string | null> => {
    if (!file) return null;

    const compressedFile = await compressImage(file);
    if (!compressedFile) {
      toast.error(`Gagal mengompres foto ${type}.`);
      return null;
    }

    const bucketName = "drainase-images";
    const folderPath = `laporan-drainase/${laporanId}/${kegiatanId}`;
    return uploadImageToSupabaseStorage(compressedFile, bucketName, folderPath);
  }, []);

  const handlePreview = useCallback(async () => {
    try {
      const blob = await generatePDF(formData, false);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Gagal membuat preview PDF');
    }
  }, [formData]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      let currentLaporanId = laporanId;

      if (currentLaporanId) {
        const { error: updateError } = await supabase
          .from('laporan_drainase')
          .update({
            tanggal: format(formData.tanggal, 'yyyy-MM-dd'),
            periode: format(formData.tanggal, 'MMMM yyyy', { locale: idLocale }),
          })
          .eq('id', currentLaporanId);

        if (updateError) throw new Error(`Gagal memperbarui laporan: ${updateError.message}`);

        const { error: deleteError } = await supabase
          .from('kegiatan_drainase')
          .delete()
          .eq('laporan_id', currentLaporanId);

        if (deleteError) throw new Error(`Gagal menghapus kegiatan lama: ${deleteError.message}`);
      } else {
        const { data: laporanData, error: laporanError } = await supabase
          .from('laporan_drainase')
          .insert({
            tanggal: format(formData.tanggal, 'yyyy-MM-dd'),
            periode: format(formData.tanggal, 'MMMM yyyy', { locale: idLocale }),
          })
          .select()
          .single();

        if (laporanError) throw new Error(`Gagal membuat laporan baru: ${laporanError.message}`);
        currentLaporanId = laporanData.id;
        setLaporanId(currentLaporanId);
      }

      if (!currentLaporanId) {
        throw new Error("ID Laporan tidak tersedia setelah penyimpanan awal.");
      }

      for (const kegiatan of formData.kegiatans) {
        const { data: kegiatanData, error: kegiatanInsertError } = await supabase
          .from('kegiatan_drainase')
          .insert({
            laporan_id: currentLaporanId,
            nama_jalan: kegiatan.namaJalan,
            kecamatan: kegiatan.kecamatan,
            kelurahan: kegiatan.kelurahan,
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

        if (kegiatanInsertError) throw new Error(`Gagal menyimpan kegiatan: ${kegiatanInsertError.message}`);

        const kegiatanDbId = kegiatanData.id;

        const foto0Url = kegiatan.foto0 
          ? (typeof kegiatan.foto0 === 'string' ? kegiatan.foto0 : await uploadFile(kegiatan.foto0, currentLaporanId, kegiatanDbId, 'foto0'))
          : (kegiatan.foto0Url || null);
        const foto50Url = kegiatan.foto50 
          ? (typeof kegiatan.foto50 === 'string' ? kegiatan.foto50 : await uploadFile(kegiatan.foto50, currentLaporanId, kegiatanDbId, 'foto50'))
          : (kegiatan.foto50Url || null);
        const foto100Url = kegiatan.foto100 
          ? (typeof kegiatan.foto100 === 'string' ? kegiatan.foto100 : await uploadFile(kegiatan.foto100, currentLaporanId, kegiatanDbId, 'foto100'))
          : (kegiatan.foto100Url || null);

        const { error: updatePhotoError } = await supabase
          .from('kegiatan_drainase')
          .update({
            foto_0_url: foto0Url,
            foto_50_url: foto50Url,
            foto_100_url: foto100Url,
          })
          .eq('id', kegiatanDbId);

        if (updatePhotoError) throw new Error(`Gagal memperbarui URL foto kegiatan: ${updatePhotoError.message}`);

        const materialsToInsert = kegiatan.materials.map(m => ({
          kegiatan_id: kegiatanDbId,
          jenis: m.jenis,
          jumlah: m.jumlah,
          satuan: m.satuan,
        }));

        const { error: materialsError } = await supabase
          .from('material_kegiatan')
          .insert(materialsToInsert);

        if (materialsError) throw new Error(`Gagal menyimpan material: ${materialsError.message}`);

        const peralatanToInsert = kegiatan.peralatans.map(p => ({
          kegiatan_id: kegiatanDbId,
          nama: p.nama,
          jumlah: p.jumlah,
        }));

        const { error: peralatanError } = await supabase
          .from('peralatan_kegiatan')
          .insert(peralatanToInsert);

        if (peralatanError) throw new Error(`Gagal menyimpan peralatan: ${peralatanError.message}`);
      }

      toast.success(laporanId ? 'Laporan berhasil diperbarui' : 'Laporan berhasil disimpan');
      navigate('/laporan');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(`Gagal menyimpan laporan: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [laporanId, formData, navigate, uploadFile]);

  const handleDownload = useCallback(async () => {
    try {
      await generatePDF(formData, true);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Gagal mendownload PDF');
    }
  }, [formData]);

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

        <KegiatanNavigation
          kegiatans={formData.kegiatans}
          currentKegiatanIndex={currentKegiatanIndex}
          setCurrentKegiatanIndex={setCurrentKegiatanIndex}
          addKegiatan={addKegiatan}
          removeKegiatan={removeKegiatan}
        />

        <Card className="p-6 space-y-6">
          <LaporanInfoSection formData={formData} setFormData={setFormData} />

          <KegiatanDetailsSection
            currentKegiatan={currentKegiatan}
            updateCurrentKegiatan={updateCurrentKegiatan}
            kelurahanOptions={kelurahanOptions}
            handleKecamatanChange={handleKecamatanChange}
            handleKelurahanChange={handleKelurahanChange}
          />

          <PhotoUploadSection
            currentKegiatan={currentKegiatan}
            updateCurrentKegiatan={updateCurrentKegiatan}
            setShowPreview={setShowPreview}
            setPreviewUrl={setPreviewUrl}
          />

          <JenisSaluranSedimenSection
            currentKegiatan={currentKegiatan}
            updateCurrentKegiatan={updateCurrentKegiatan}
          />

          <ActivityMeasurementsSection
            currentKegiatan={currentKegiatan}
            updateCurrentKegiatan={updateCurrentKegiatan}
          />

          <MaterialsSection
            currentKegiatan={currentKegiatan}
            updateCurrentKegiatan={updateCurrentKegiatan}
          />

          <PeralatanSection
            currentKegiatan={currentKegiatan}
            updateCurrentKegiatan={updateCurrentKegiatan}
          />

          <KoordinatorPHLSection
            currentKegiatan={currentKegiatan}
            updateCurrentKegiatan={updateCurrentKegiatan}
          />

          <KeteranganSection
            currentKegiatan={currentKegiatan}
            updateCurrentKegiatan={updateCurrentKegiatan}
          />

          <FormActions
            handlePreview={handlePreview}
            handleSave={handleSave}
            handleDownload={handleDownload}
            isSaving={isSaving}
          />
        </Card>

        <PdfPreviewDialog
          showPreview={showPreview}
          setShowPreview={setShowPreview}
          previewUrl={previewUrl}
        />
      </div>
    </div>
  );
};