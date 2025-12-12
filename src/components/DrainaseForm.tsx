import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom"; 
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
import { format, parse, isValid } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CalendarIcon, Plus, Trash2, FileText, Eye, Save, List, Download, Check, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { LaporanDrainase, KegiatanDrainase, Material, Peralatan, OperasionalAlatBerat, AktifitasPenangananDetail } from "@/types/laporan";
import { PenangananDetailFormState } from "@/types/form-types";
import { kecamatanKelurahanData, koordinatorOptions, satuanOptions, materialDefaultUnits, peralatanOptions, materialOptions, alatBeratOptions } from "@/data/kecamatan-kelurahan";
import { toast } from "sonner";
import { generatePDF } from "@/lib/pdf-generator";
import { generatePDFTersier } from "@/lib/pdf-generator-tersier";
import { supabase } from "@/integrations/supabase/client";
import { OperasionalAlatBeratSection } from "./drainase-form/OperasionalAlatBeratSection";
import { PeralatanSection } from "./drainase-form/PeralatanSection";
import { PenangananDetailSection } from "./drainase-form/PenangananDetailSection";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "./SessionContextProvider";

const predefinedSedimenOptions = [
  "Padat", "Cair", "Padat & Cair", "Batu", "Batu/Padat", "Batu/Cair",
  "Padat & Batu", "Padat/ Gulma & Sampah", "Padat/ Cair/Sampah", "Gulma/Rumput",
  "Batu/ Padat & Cair", "Sampah"
];

// Initial state for a new PenangananDetailFormState
const createNewPenangananDetailFormState = (): PenangananDetailFormState => ({
  id: "detail-" + Date.now().toString(),
  foto0: [],
  foto50: [],
  foto100: [],
  fotoSket: [],
  jenisSaluran: "",
  jenisSedimen: "",
  aktifitasPenanganan: "",
  materials: [{ id: "material-" + Date.now().toString(), jenis: "", jumlah: "", satuan: "M³", keterangan: "" }],
  selectedSedimenOption: "",
  customSedimen: "",
  materialCustomInputs: {},
});

export const DrainaseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSession();

  const [formData, setFormData] = useState<LaporanDrainase>({
    tanggal: null,
    periode: format(new Date(), 'MMMM yyyy', { locale: idLocale }),
    reportType: "harian",
    kegiatans: [{
      id: "kegiatan-" + Date.now().toString(),
      namaJalan: "",
      kecamatan: "",
      kelurahan: "",
      panjangPenanganan: "",
      lebarRataRata: "",
      rataRataSedimen: "",
      volumeGalian: "",
      peralatans: [{ id: "peralatan-" + Date.now().toString(), nama: "", jumlah: 1, satuan: "Unit" }],
      operasionalAlatBerats: [{
        id: "operasional-" + Date.now().toString(),
        jenis: "",
        jumlah: 0,
        dexliteJumlah: "",
        dexliteSatuan: "Liter",
        pertaliteJumlah: "",
        pertaliteSatuan: "Liter",
        bioSolarJumlah: "",
        bioSolarSatuan: "Liter",
        keterangan: "",
      }],
      koordinator: [],
      jumlahPHL: 0,
      keterangan: "",
      hariTanggal: new Date(),
      jumlahUPT: 0,
      jumlahP3SU: 0,
      rencanaPanjang: "",
      rencanaVolume: "",
      realisasiPanjang: "",
      realisasiVolume: "",
      sisaTargetHari: "",
      aktifitasPenangananDetails: [createNewPenangananDetailFormState()], // Initialize with one detail
    }]
  });

  const [currentKegiatanIndex, setCurrentKegiatanIndex] = useState(0);
  const [selectedKecamatan, setSelectedKecamatan] = useState("");
  const [kelurahanOptions, setKelurahanOptions] = useState<string[]>([]);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [laporanId, setLaporanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [peralatanCustomInputs, setPeralatanCustomInputs] = useState<Record<string, string>>({});
  const [operasionalCustomInputs, setOperasionalCustomInputs] = useState<Record<string, string>>({});

  const currentKegiatan = formData.kegiatans[currentKegiatanIndex];
  const lastCalculatedVolumeRef = useRef<string | null>(null);

  const [mainDateInputString, setMainDateInputString] = useState<string>(
    formData.tanggal ? format(formData.tanggal, "dd/MM/yyyy", { locale: idLocale }) : ""
  );

  const [activityDateInputString, setActivityDateInputString] = useState<string>(
    currentKegiatan.hariTanggal ? format(currentKegiatan.hariTanggal, "dd/MM/yyyy", { locale: idLocale }) : ""
  );

  // Helper to ensure array of strings for URLs
  const ensureArray = (value: string | string[] | null | undefined): string[] => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string' && value) {
      return [value];
    }
    return [];
  };

  useEffect(() => {
    if (id) {
      loadLaporan(id);
    }
  }, [id]);

  // Update local state for current activity when currentKegiatanIndex changes
  useEffect(() => {
    if (formData.kegiatans.length > 0) {
      const currentKec = formData.kegiatans[currentKegiatanIndex];
      setSelectedKecamatan(currentKec.kecamatan);
      const selected = kecamatanKelurahanData.find((k) => k.kecamatan === currentKec.kecamatan);
      setKelurahanOptions(selected?.kelurahan || []);

      // Update activity date input string
      setActivityDateInputString(
        currentKec.hariTanggal ? format(currentKec.hariTanggal, "dd/MM/yyyy", { locale: idLocale }) : ""
      );

      // Initialize custom inputs for Peralatan
      const initialPeralatanCustomInputs: Record<string, string> = {};
      currentKec.peralatans.forEach(p => {
        if (!peralatanOptions.includes(p.nama) && p.nama !== "") {
          initialPeralatanCustomInputs[p.id] = p.nama;
          p.nama = "custom";
        }
      });
      setPeralatanCustomInputs(initialPeralatanCustomInputs);

      // Initialize custom inputs for Operasional Alat Berat
      const initialOperasionalCustomInputs: Record<string, string> = {};
      currentKec.operasionalAlatBerats.forEach(op => {
        if (!alatBeratOptions.includes(op.jenis) && op.jenis !== "") {
          initialOperasionalCustomInputs[op.id] = op.jenis;
          op.jenis = "custom";
        }
      });
      setOperasionalCustomInputs(initialOperasionalCustomInputs);

    } else {
      setSelectedKecamatan("");
      setKelurahanOptions([]);
      setActivityDateInputString("");
      setPeralatanCustomInputs({});
      setOperasionalCustomInputs({});
    }
  }, [formData.kegiatans, currentKegiatanIndex]);

  // Update main report date input string
  useEffect(() => {
    setMainDateInputString(
      formData.tanggal ? format(formData.tanggal, "dd/MM/yyyy", { locale: idLocale }) : ""
    );
  }, [formData.tanggal]);

  useEffect(() => {
    // Only calculate volume for Harian/Bulanan reports
    if (formData.reportType !== "tersier") {
      const panjang = parseFloat(currentKegiatan.panjangPenanganan.replace(',', '.')) || 0;
      const lebar = parseFloat(currentKegiatan.lebarRataRata.replace(',', '.')) || 0;
      const tinggi = parseFloat(currentKegiatan.rataRataSedimen.replace(',', '.')) || 0;

      const calculatedVolume = (panjang * lebar * tinggi).toFixed(2);

      const isVolumeGalianEmpty = currentKegiatan.volumeGalian === "";
      const isVolumeGalianSameAsLastCalculated = currentKegiatan.volumeGalian === lastCalculatedVolumeRef.current;

      if (isVolumeGalianEmpty || (isVolumeGalianSameAsLastCalculated && currentKegiatan.volumeGalian !== calculatedVolume)) {
        updateCurrentKegiatan({ volumeGalian: calculatedVolume });
      }

      lastCalculatedVolumeRef.current = calculatedVolume;
    }
  }, [
    currentKegiatan.panjangPenanganan,
    currentKegiatan.lebarRataRata,
    currentKegiatan.rataRataSedimen,
    currentKegiatanIndex,
    formData.reportType,
  ]);

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
          const [peralatanRes, operasionalRes, aktifitasDetailsRes] = await Promise.all([
            supabase.from('peralatan_kegiatan').select('*').eq('kegiatan_id', kegiatan.id),
            supabase.from('operasional_alat_berat_kegiatan').select('*').eq('kegiatan_id', kegiatan.id),
            supabase.from('aktifitas_penanganan_detail').select('*').eq('kegiatan_id', kegiatan.id),
          ]);

          let peralatans = (peralatanRes.data || []).map(p => ({
            id: p.id,
            nama: p.nama,
            jumlah: p.jumlah,
            satuan: p.satuan || "Unit",
          }));
          if (peralatans.length === 0) {
            peralatans.push({ id: "peralatan-" + Date.now().toString() + '-per', nama: "", jumlah: 1, satuan: "Unit" });
          }

          let operasionalAlatBerats = (operasionalRes.data || []).map(o => ({
            id: o.id,
            jenis: o.jenis,
            jumlah: o.jumlah,
            dexliteJumlah: o.dexlite_jumlah || "",
            dexliteSatuan: o.dexlite_satuan || "Liter",
            pertaliteJumlah: o.pertalite_jumlah || "",
            pertaliteSatuan: o.pertalite_satuan || "Liter",
            bioSolarJumlah: o.bio_solar_jumlah || "",
            bioSolarSatuan: o.bio_solar_satuan || "Liter",
            keterangan: o.keterangan || "",
          }));
          if (operasionalAlatBerats.length === 0 && laporanData.report_type !== "tersier") {
            operasionalAlatBerats.push({
              id: "operasional-" + Date.now().toString() + '-op',
              jenis: "",
              jumlah: 0,
              dexliteJumlah: "",
              dexliteSatuan: "Liter",
              pertaliteJumlah: "",
              pertaliteSatuan: "Liter",
              bioSolarJumlah: "",
              bioSolarSatuan: "Liter",
              keterangan: "",
            });
          }

          const aktifitasPenangananDetails: AktifitasPenangananDetail[] = await Promise.all(
            (aktifitasDetailsRes.data || []).map(async (detail) => {
              const { data: materialsRes, error: materialsError } = await supabase
                .from('material_kegiatan')
                .select('*')
                .eq('aktifitas_detail_id', detail.id);

              if (materialsError) {
                console.error("Error fetching materials for aktifitas_detail_id:", detail.id, materialsError);
                throw materialsError;
              }

              let materials = (materialsRes.data || []).map(m => ({
                id: m.id,
                jenis: m.jenis,
                jumlah: m.jumlah,
                satuan: m.satuan,
                keterangan: m.keterangan || "",
                aktifitas_detail_id: m.aktifitas_detail_id || undefined,
              }));
              if (materials.length === 0 && laporanData.report_type !== "tersier") {
                materials.push({ id: "material-" + Date.now().toString() + '-mat', jenis: "", jumlah: "", satuan: "M³", keterangan: "" });
              }

              return {
                id: detail.id,
                kegiatanId: detail.kegiatan_id,
                jenisSaluran: (detail.jenis_saluran || "") as "Terbuka" | "Tertutup" | "Terbuka & Tertutup" | "",
                jenisSedimen: (detail.jenis_sedimen || "") as string,
                aktifitasPenanganan: detail.aktifitas_penanganan || "",
                foto0: ensureArray(detail.foto_0_url),
                foto50: ensureArray(detail.foto_50_url),
                foto100: ensureArray(detail.foto_100_url),
                fotoSket: ensureArray(detail.foto_sket_url),
                foto0Url: ensureArray(detail.foto_0_url),
                foto50Url: ensureArray(detail.foto_50_url),
                foto100Url: ensureArray(detail.foto_100_url),
                fotoSketUrl: ensureArray(detail.foto_sket_url),
                materials: materials,
              };
            })
          );

          // Ensure at least one aktifitasPenangananDetail for new forms
          if (aktifitasPenangananDetails.length === 0 && laporanData.report_type !== "tersier") {
            aktifitasPenangananDetails.push(createNewPenangananDetailFormState());
          }

          return {
            id: kegiatan.id,
            namaJalan: kegiatan.nama_jalan,
            kecamatan: kegiatan.kecamatan,
            kelurahan: kegiatan.kelurahan,
            panjangPenanganan: kegiatan.panjang_penanganan || "",
            lebarRataRata: kegiatan.lebar_rata_rata || "",
            rataRataSedimen: kegiatan.rata_rata_sedimen || "",
            volumeGalian: kegiatan.volume_galian || "",
            peralatans: peralatans,
            operasionalAlatBerats: operasionalAlatBerats,
            koordinator: kegiatan.koordinator || [],
            jumlahPHL: kegiatan.jumlah_phl || 0,
            keterangan: kegiatan.keterangan || "",
            hariTanggal: kegiatan.hari_tanggal ? new Date(kegiatan.hari_tanggal) : new Date(),
            jumlahUPT: kegiatan.jumlah_upt || 0,
            jumlahP3SU: kegiatan.jumlah_p3su || 0,
            rencanaPanjang: kegiatan.rencana_panjang || "",
            rencanaVolume: kegiatan.rencana_volume || "",
            realisasiPanjang: kegiatan.realisasi_panjang || "",
            realisasiVolume: kegiatan.realisasi_volume || "",
            sisaTargetHari: kegiatan.sisa_target || "",
            aktifitasPenangananDetails: aktifitasPenangananDetails,
          };
        })
      );

      setFormData({
        tanggal: laporanData.tanggal ? new Date(laporanData.tanggal) : null,
        periode: laporanData.periode,
        reportType: (laporanData.report_type || "harian") as "harian" | "bulanan" | "tersier",
        kegiatans: kegiatansWithDetails.length > 0 ? kegiatansWithDetails : [
          {
            id: "kegiatan-" + Date.now().toString(),
            namaJalan: "", kecamatan: "", kelurahan: "",
            panjangPenanganan: "", lebarRataRata: "", rataRataSedimen: "", volumeGalian: "",
            peralatans: [{ id: "peralatan-" + Date.now().toString(), nama: "", jumlah: 1, satuan: "Unit" }],
            operasionalAlatBerats: [{ id: "operasional-" + Date.now().toString(), jenis: "", jumlah: 0, dexliteJumlah: "", dexliteSatuan: "Liter", pertaliteJumlah: "", pertaliteSatuan: "Liter", bioSolarJumlah: "", bioSolarSatuan: "Liter", keterangan: "" }],
            koordinator: [], jumlahPHL: 0, keterangan: "", hariTanggal: new Date(),
            jumlahUPT: 0, jumlahP3SU: 0, rencanaPanjang: "", rencanaVolume: "", realisasiPanjang: "", realisasiVolume: "", sisaTargetHari: "",
            aktifitasPenangananDetails: [createNewPenangananDetailFormState()],
          }
        ]
      });

      if (kegiatansWithDetails.length > 0) {
        setCurrentKegiatanIndex(0);
      } else {
        setCurrentKegiatanIndex(0);
      }

      toast.success('Laporan berhasil dimuat');
    } catch (error: any) {
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

  const handleSetCurrentKegiatanIndex = (index: number) => {
    setCurrentKegiatanIndex(index);
  };

  const addKegiatan = () => {
    const newKegiatan: KegiatanDrainase = {
      id: "kegiatan-" + Date.now().toString(),
      namaJalan: "",
      kecamatan: "",
      kelurahan: "",
      panjangPenanganan: "",
      lebarRataRata: "",
      rataRataSedimen: "",
      volumeGalian: "",
      peralatans: [{ id: "peralatan-" + Date.now().toString(), nama: "", jumlah: 1, satuan: "Unit" }],
      operasionalAlatBerats: [{
        id: "operasional-" + Date.now().toString(),
        jenis: "",
        jumlah: 0,
        dexliteJumlah: "",
        dexliteSatuan: "Liter",
        pertaliteJumlah: "",
        pertaliteSatuan: "Liter",
        bioSolarJumlah: "",
        bioSolarSatuan: "Liter",
        keterangan: "",
      }],
      koordinator: [],
      jumlahPHL: 0,
      keterangan: "",
      hariTanggal: new Date(),
      jumlahUPT: 0,
      jumlahP3SU: 0,
      rencanaPanjang: "",
      rencanaVolume: "",
      realisasiPanjang: "",
      realisasiVolume: "",
      sisaTargetHari: "",
      aktifitasPenangananDetails: [createNewPenangananDetailFormState()],
    };
    setFormData({ ...formData, kegiatans: [...formData.kegiatans, newKegiatan] });
    setCurrentKegiatanIndex(formData.kegiatans.length);
    setPeralatanCustomInputs({});
    setOperasionalCustomInputs({});
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
    updateCurrentKegiatan({ kecamatan: value, kelurahan: "" });
  };

  const handleKelurahanChange = (value: string) => {
    updateCurrentKegiatan({ kelurahan: value });
  };

  const updateAktifitasPenangananDetail = useCallback((detailIndex: number, updates: Partial<PenangananDetailFormState>) => {
    const newDetails = [...currentKegiatan.aktifitasPenangananDetails];
    const updatedDetail = { ...newDetails[detailIndex], ...updates };

    // Handle custom material inputs within the detail
    if (updates.materialCustomInputs) {
      updatedDetail.materialCustomInputs = { ...updatedDetail.materialCustomInputs, ...updates.materialCustomInputs };
    }
    if (updates.materials) {
      updatedDetail.materials = updates.materials;
    }

    newDetails[detailIndex] = updatedDetail;
    updateCurrentKegiatan({ aktifitasPenangananDetails: newDetails });
  }, [currentKegiatan, updateCurrentKegiatan]);

  const addAktifitasPenangananDetail = () => {
    const newDetail = createNewPenangananDetailFormState();
    updateCurrentKegiatan({
      aktifitasPenangananDetails: [...currentKegiatan.aktifitasPenangananDetails, newDetail],
    });
  };

  const removeAktifitasPenangananDetail = (detailIndex: number) => {
    if (currentKegiatan.aktifitasPenangananDetails.length > 1) {
      const newDetails = currentKegiatan.aktifitasPenangananDetails.filter((_, i) => i !== detailIndex);
      updateCurrentKegiatan({ aktifitasPenangananDetails: newDetails });
    }
  };

  const toggleKoordinator = (koordinatorName: string) => {
    const currentCoordinators = currentKegiatan.koordinator;
    if (currentCoordinators.includes(koordinatorName)) {
      updateCurrentKegiatan({
        koordinator: currentCoordinators.filter((name) => name !== koordinatorName),
      });
    } else {
      updateCurrentKegiatan({
        koordinator: [...currentCoordinators, koordinatorName],
      });
    }
  };

  const uploadFiles = async (files: (File | string | null)[], basePath: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    for (const fileOrUrl of files) {
      if (fileOrUrl instanceof File) {
        const fileName = `${basePath}/${fileOrUrl.name}`;
        const { data, error } = await supabase.storage
          .from('laporan-photos')
          .upload(fileName, fileOrUrl, { upsert: true });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('laporan-photos')
          .getPublicUrl(data.path);
        uploadedUrls.push(publicUrl);
      } else if (typeof fileOrUrl === 'string' && fileOrUrl) {
        uploadedUrls.push(fileOrUrl);
      }
    }
    return uploadedUrls;
  };

  const handlePrintPreview = async () => {
    // Aggregate current form data for PDF generation
    const laporanForPdf: LaporanDrainase = {
      tanggal: formData.tanggal || currentKegiatan.hariTanggal || new Date(),
      periode: formData.periode,
      reportType: formData.reportType,
      kegiatans: [{
        ...currentKegiatan,
        peralatans: currentKegiatan.peralatans.map(p => ({
          ...p,
          nama: p.nama === "custom" ? peralatanCustomInputs[p.id] || "" : p.nama,
        })),
        operasionalAlatBerats: currentKegiatan.operasionalAlatBerats.map(o => ({
          ...o,
          jenis: o.jenis === "custom" ? operasionalCustomInputs[o.id] || "" : o.jenis,
        })),
        aktifitasPenangananDetails: currentKegiatan.aktifitasPenangananDetails.map(detail => ({
          ...detail,
          materials: detail.materials.map(m => ({
            ...m,
            jenis: m.jenis === "custom" ? (detail.materialCustomInputs[m.id] || "") : m.jenis,
          })),
        })),
      }],
    };

    try {
      let blob: Blob;
      if (laporanForPdf.reportType === "tersier") {
        blob = await generatePDFTersier(laporanForPdf, false);
      } else {
        blob = await generatePDF(laporanForPdf, false);
      }
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setShowPreviewDialog(true);
      toast.success("Laporan berhasil dipratinjau.");
    } catch (error) {
      console.error("Preview error:", error);
      toast.error("Gagal membuat pratinjau PDF.");
    }
  };

  const handlePrintDownload = async () => {
    // Aggregate current form data for PDF generation
    const laporanForPdf: LaporanDrainase = {
      tanggal: formData.tanggal || currentKegiatan.hariTanggal || new Date(),
      periode: formData.periode,
      reportType: formData.reportType,
      kegiatans: [{
        ...currentKegiatan,
        peralatans: currentKegiatan.peralatans.map(p => ({
          ...p,
          nama: p.nama === "custom" ? peralatanCustomInputs[p.id] || "" : p.nama,
        })),
        operasionalAlatBerats: currentKegiatan.operasionalAlatBerats.map(o => ({
          ...o,
          jenis: o.jenis === "custom" ? operasionalCustomInputs[o.id] || "" : o.jenis,
        })),
        aktifitasPenangananDetails: currentKegiatan.aktifitasPenangananDetails.map(detail => ({
          ...detail,
          materials: detail.materials.map(m => ({
            ...m,
            jenis: m.jenis === "custom" ? (detail.materialCustomInputs[m.id] || "") : m.jenis,
          })),
        })),
      }],
    };

    try {
      if (laporanForPdf.reportType === "tersier") {
        await generatePDFTersier(laporanForPdf, true);
      } else {
        await generatePDF(laporanForPdf, true);
      }
      toast.success("Laporan berhasil diunduh.");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Gagal mengunduh PDF.");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!user) {
        toast.error("Anda harus login untuk menyimpan laporan.");
        setIsSaving(false);
        return;
      }

      let currentLaporanId = laporanId;

      const finalReportDate = formData.reportType === "tersier" 
        ? formData.kegiatans[0]?.hariTanggal || new Date()
        : formData.tanggal || formData.kegiatans[0]?.hariTanggal || new Date();

      const finalPeriode = formData.periode || format(finalReportDate, 'MMMM yyyy', { locale: idLocale });

      // 1. Save/Update main laporan_drainase entry
      if (currentLaporanId) {
        const { error: updateError } = await supabase
          .from('laporan_drainase')
          .update({
            tanggal: format(finalReportDate, 'yyyy-MM-dd'),
            periode: finalPeriode,
            report_type: formData.reportType,
            user_id: user.id,
          })
          .eq('id', currentLaporanId);

        if (updateError) throw updateError;
      } else {
        const { data: laporanData, error: laporanError } = await supabase
          .from('laporan_drainase')
          .insert({
            tanggal: format(finalReportDate, 'yyyy-MM-dd'),
            periode: finalPeriode,
            report_type: formData.reportType,
            user_id: user.id,
          })
          .select()
          .single();

        if (laporanError) throw laporanError;
        currentLaporanId = laporanData.id;
        setLaporanId(currentLaporanId);
      }

      // 2. Fetch existing kegiatan IDs for comparison
      const { data: existingKegiatanRecords, error: fetchKegiatanError } = await supabase
        .from('kegiatan_drainase')
        .select('id')
        .eq('laporan_id', currentLaporanId);

      if (fetchKegiatanError) throw fetchKegiatanError;
      const existingKegiatanIds = new Set(existingKegiatanRecords.map(k => k.id));
      const kegiatansToKeepInDb = new Set<string>();

      // 3. Iterate over all activities in formData.kegiatans
      for (const kegiatanToProcess of formData.kegiatans) {
        let kegiatanDbId = kegiatanToProcess.id;

        const kegiatanDataToSave = {
          laporan_id: currentLaporanId,
          nama_jalan: kegiatanToProcess.namaJalan,
          kecamatan: kegiatanToProcess.kecamatan,
          kelurahan: kegiatanToProcess.kelurahan,
          panjang_penanganan: kegiatanToProcess.panjangPenanganan,
          lebar_rata_rata: kegiatanToProcess.lebarRataRata,
          rata_rata_sedimen: kegiatanToProcess.rataRataSedimen,
          volume_galian: kegiatanToProcess.volumeGalian,
          koordinator: kegiatanToProcess.koordinator,
          jumlah_phl: kegiatanToProcess.jumlahPHL,
          keterangan: kegiatanToProcess.keterangan,
          hari_tanggal: kegiatanToProcess.hariTanggal ? format(kegiatanToProcess.hariTanggal, 'yyyy-MM-dd') : null,
          jumlah_upt: kegiatanToProcess.jumlahUPT,
          jumlah_p3su: kegiatanToProcess.jumlahP3SU,
          sisa_target: kegiatanToProcess.sisaTargetHari,
          rencana_panjang: kegiatanToProcess.rencanaPanjang,
          rencana_volume: kegiatanToProcess.rencanaVolume,
          realisasi_panjang: kegiatanToProcess.realisasiPanjang,
          realisasi_volume: kegiatanToProcess.realisasiVolume,
        };

        if (existingKegiatanIds.has(kegiatanToProcess.id)) {
          const { error: updateKegiatanError } = await supabase
            .from('kegiatan_drainase')
            .update(kegiatanDataToSave)
            .eq('id', kegiatanToProcess.id);
          if (updateKegiatanError) throw updateKegiatanError;
          kegiatanDbId = kegiatanToProcess.id;
          kegiatansToKeepInDb.add(kegiatanDbId);
        } else {
          const { data: newKegiatanRecord, error: insertKegiatanError } = await supabase
            .from('kegiatan_drainase')
            .insert(kegiatanDataToSave)
            .select('id')
            .single();
          if (insertKegiatanError) throw insertKegiatanError;
          kegiatanDbId = newKegiatanRecord.id;
          kegiatansToKeepInDb.add(kegiatanDbId);
        }

        // Handle Peralatan and Operasional Alat Berat for this kegiatan
        await supabase.from('peralatan_kegiatan').delete().eq('kegiatan_id', kegiatanDbId);
        await supabase.from('operasional_alat_berat_kegiatan').delete().eq('kegiatan_id', kegiatanDbId);

        const peralatanToInsert = kegiatanToProcess.peralatans.filter(p => p.nama || p.jumlah).map(p => ({
          kegiatan_id: kegiatanDbId,
          nama: p.nama === "custom" ? peralatanCustomInputs[p.id] || "" : p.nama,
          jumlah: p.jumlah,
          satuan: p.satuan,
        }));
        if (peralatanToInsert.length > 0) {
          const { error: peralatanError } = await supabase.from('peralatan_kegiatan').insert(peralatanToInsert);
          if (peralatanError) throw peralatanError;
        }

        const operasionalAlatBeratsToInsert = kegiatanToProcess.operasionalAlatBerats.filter(o => o.jenis || o.jumlah || o.dexliteJumlah || o.pertaliteJumlah || o.bioSolarJumlah).map(o => ({
          kegiatan_id: kegiatanDbId,
          jenis: o.jenis === "custom" ? operasionalCustomInputs[o.id] || "" : o.jenis,
          jumlah: o.jumlah,
          dexlite_jumlah: o.dexliteJumlah,
          dexlite_satuan: o.dexliteSatuan,
          pertalite_jumlah: o.pertaliteJumlah,
          pertalite_satuan: o.pertaliteSatuan,
          bio_solar_jumlah: o.bioSolarJumlah,
          bio_solar_satuan: o.bioSolarSatuan,
          keterangan: o.keterangan,
        }));
        if (operasionalAlatBeratsToInsert.length > 0) {
          const { error: operasionalError } = await supabase.from('operasional_alat_berat_kegiatan').insert(operasionalAlatBeratsToInsert);
          if (operasionalError) throw operasionalError;
        }

        // Handle Aktifitas Penanganan Details for this kegiatan
        const { data: existingAktifitasDetails, error: fetchDetailsError } = await supabase
          .from('aktifitas_penanganan_detail')
          .select('id')
          .eq('kegiatan_id', kegiatanDbId);
        if (fetchDetailsError) throw fetchDetailsError;
        const existingAktifitasDetailIds = new Set(existingAktifitasDetails.map(d => d.id));
        const aktifitasDetailsToKeepInDb = new Set<string>();

        for (const detailToProcess of kegiatanToProcess.aktifitasPenangananDetails) {
          let detailDbId = detailToProcess.id;

          // Upload files for this specific detail
          const foto0Urls = await uploadFiles(detailToProcess.foto0, `${currentLaporanId}/${kegiatanDbId}/${detailToProcess.id}/0`);
          const foto50Urls = await uploadFiles(detailToProcess.foto50, `${currentLaporanId}/${kegiatanDbId}/${detailToProcess.id}/50`);
          const foto100Urls = await uploadFiles(detailToProcess.foto100, `${currentLaporanId}/${kegiatanDbId}/${detailToProcess.id}/100`);
          const fotoSketUrls = await uploadFiles(detailToProcess.fotoSket, `${currentLaporanId}/${kegiatanDbId}/${detailToProcess.id}/sket`);

          const detailDataToSave = {
            kegiatan_id: kegiatanDbId,
            jenis_saluran: detailToProcess.jenisSaluran,
            jenis_sedimen: detailToProcess.jenisSedimen === "custom" ? (detailToProcess.materialCustomInputs[detailToProcess.id] || "") : detailToProcess.jenisSedimen,
            aktifitas_penanganan: detailToProcess.aktifitasPenanganan,
            foto_0_url: foto0Urls,
            foto_50_url: foto50Urls,
            foto_100_url: foto100Urls,
            foto_sket_url: fotoSketUrls,
          };

          if (existingAktifitasDetailIds.has(detailToProcess.id)) {
            const { error: updateDetailError } = await supabase
              .from('aktifitas_penanganan_detail')
              .update(detailDataToSave)
              .eq('id', detailToProcess.id);
            if (updateDetailError) throw updateDetailError;
            detailDbId = detailToProcess.id;
            aktifitasDetailsToKeepInDb.add(detailDbId);
          } else {
            const { data: newDetailRecord, error: insertDetailError } = await supabase
              .from('aktifitas_penanganan_detail')
              .insert(detailDataToSave)
              .select('id')
              .single();
            if (insertDetailError) throw insertDetailError;
            detailDbId = newDetailRecord.id;
            aktifitasDetailsToKeepInDb.add(detailDbId);
          }

          // Handle Materials for this specific aktifitas_penanganan_detail
          await supabase.from('material_kegiatan').delete().eq('aktifitas_detail_id', detailDbId);
          const materialsToInsert = detailToProcess.materials.filter(m => m.jenis || m.jumlah || m.satuan).map(m => ({
            aktifitas_detail_id: detailDbId,
            jenis: m.jenis === "custom" ? (detailToProcess.materialCustomInputs[m.id] || "") : m.jenis,
            jumlah: m.jumlah,
            satuan: m.satuan,
            keterangan: m.keterangan,
          }));
          if (materialsToInsert.length > 0) {
            const { error: materialsError } = await supabase.from('material_kegiatan').insert(materialsToInsert);
            if (materialsError) throw materialsError;
          }
        }

        // Delete aktifitas_penanganan_detail records that are in DB but no longer in formData
        const detailsToDeleteFromDb = Array.from(existingAktifitasDetailIds).filter(id => !aktifitasDetailsToKeepInDb.has(id));
        if (detailsToDeleteFromDb.length > 0) {
          await supabase.from('material_kegiatan').delete().in('aktifitas_detail_id', detailsToDeleteFromDb);
          await supabase.from('aktifitas_penanganan_detail').delete().in('id', detailsToDeleteFromDb);
        }
      }

      // 4. Delete activities that are in DB but no longer in formData.kegiatans
      const idsToDeleteFromDb = Array.from(existingKegiatanIds).filter(id => !kegiatansToKeepInDb.has(id));
      if (idsToDeleteFromDb.length > 0) {
        // Cascade delete should handle sub-records, but explicitly deleting for clarity/safety
        await supabase.from('material_kegiatan').delete().in('aktifitas_detail_id', idsToDeleteFromDb); // This might need to be more complex if materials are not directly linked to kegiatan_id
        await supabase.from('aktifitas_penanganan_detail').delete().in('kegiatan_id', idsToDeleteFromDb);
        await supabase.from('peralatan_kegiatan').delete().in('kegiatan_id', idsToDeleteFromDb);
        await supabase.from('operasional_alat_berat_kegiatan').delete().in('kegiatan_id', idsToDeleteFromDb);
        await supabase.from('kegiatan_drainase').delete().in('id', idsToDeleteFromDb);
      }

      toast.success(laporanId ? 'Laporan berhasil diperbarui' : 'Laporan berhasil disimpan');
      navigate('/');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error('Gagal menyimpan laporan: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMainDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMainDateInputString(value);

    if (value === "") {
      setFormData((prev) => ({ ...prev, tanggal: null }));
    } else {
      const parsedDate = parse(value, "dd/MM/yyyy", new Date(), { locale: idLocale });
      if (isValid(parsedDate)) {
        setFormData((prev) => ({ ...prev, tanggal: parsedDate, periode: format(parsedDate, 'MMMM yyyy', { locale: idLocale }) }));
      }
    }
  };

  const handleMainDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, tanggal: date, periode: format(date, 'MMMM yyyy', { locale: idLocale }) }));
      setMainDateInputString(format(date, "dd/MM/yyyy", { locale: idLocale }));
    } else {
      setFormData((prev) => ({ ...prev, tanggal: null, periode: "" }));
      setMainDateInputString("");
    }
  };

  const handleActivityDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setActivityDateInputString(value);

    if (value === "") {
      updateCurrentKegiatan({ hariTanggal: null });
    } else {
      const parsedDate = parse(value, "dd/MM/yyyy", new Date(), { locale: idLocale });
      if (isValid(parsedDate)) {
        updateCurrentKegiatan({ hariTanggal: parsedDate });
        if (!laporanId) {
          setFormData((prev) => ({ ...prev, periode: format(parsedDate, 'MMMM yyyy', { locale: idLocale }) }));
        }
      }
    }
  };

  const handleActivityDateSelect = (date: Date | undefined) => {
    if (date) {
      updateCurrentKegiatan({ hariTanggal: date });
      setActivityDateInputString(format(date, "dd/MM/yyyy", { locale: idLocale }));
      if (!laporanId) {
        setFormData((prev) => ({ ...prev, periode: format(date, 'MMMM yyyy', { locale: idLocale }) }));
      }
    } else {
      updateCurrentKegiatan({ hariTanggal: null });
      setActivityDateInputString("");
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
          <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
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
                  onClick={() => handleSetCurrentKegiatanIndex(index)}
                >
                  Kegiatan {index + 1}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={addKegiatan}>
                <Plus className="h-4 w-4 mr-1" />
                Tambah Kegiatan
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
          {/* Report Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="report-type">Jenis Laporan</Label>
            <Select
              value={formData.reportType}
              onValueChange={(value) => setFormData({ ...formData, reportType: value as "harian" | "bulanan" | "tersier" })}
            >
              <SelectTrigger id="report-type">
                <SelectValue placeholder="Pilih jenis laporan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="harian">Harian</SelectItem>
                <SelectItem value="bulanan">Bulanan</SelectItem>
                <SelectItem value="tersier">Tersier</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Periode Laporan (Always visible, now the primary time identifier) */}
          <div className="space-y-2">
            <Label htmlFor="periode-laporan">Periode Laporan</Label>
            <Input
              id="periode-laporan"
              value={formData.periode}
              onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
              placeholder="Contoh: November 2025"
              disabled={formData.reportType !== "bulanan"}
            />
            {formData.reportType !== "bulanan" && (
              <p className="text-xs text-muted-foreground">
                Periode laporan otomatis diambil dari Hari/Tanggal Kegiatan.
              </p>
            )}
          </div>

          {/* Main Report Date (Only for Harian/Bulanan) */}
          {(formData.reportType === "harian" || formData.reportType === "bulanan") && (
            <div className="space-y-2">
              <Label htmlFor="tanggal-laporan-utama">Tanggal Laporan Utama</Label>
              <div className="relative flex items-center">
                <Input
                  id="tanggal-laporan-utama"
                  value={mainDateInputString}
                  onChange={handleMainDateInputChange}
                  placeholder="dd/MM/yyyy"
                  className={cn(
                    "w-full justify-start text-left font-normal pr-10",
                    !formData.tanggal && "text-muted-foreground"
                  )}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="absolute right-0 h-full px-3 py-2 rounded-l-none border-y-0 border-r-0"
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" sideOffset={5}>
                    <Calendar
                      mode="single"
                      selected={formData.tanggal || undefined}
                      onSelect={handleMainDateSelect}
                      initialFocus
                      locale={idLocale}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Hari/Tanggal Kegiatan (Always visible for Harian and Tersier) */}
          {(formData.reportType === "harian" || formData.reportType === "tersier") && (
            <div className="space-y-2">
              <Label htmlFor={`hari-tanggal-kegiatan-${currentKegiatan.id}`}>Hari/Tanggal Kegiatan</Label>
              <div className="relative flex items-center">
                <Input
                  id={`hari-tanggal-kegiatan-${currentKegiatan.id}`}
                  value={activityDateInputString}
                  onChange={handleActivityDateInputChange}
                  placeholder="dd/MM/yyyy"
                  className={cn(
                    "w-full justify-start text-left font-normal pr-10",
                    !currentKegiatan.hariTanggal && "text-muted-foreground"
                  )}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="absolute right-0 h-full px-3 py-2 rounded-l-none border-y-0 border-r-0"
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" sideOffset={5}>
                    <Calendar
                      mode="single"
                      selected={currentKegiatan.hariTanggal || undefined}
                      onSelect={handleActivityDateSelect}
                      initialFocus
                      locale={idLocale}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Lokasi */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`nama-jalan-${currentKegiatan.id}`}>Nama Jalan</Label>
              <Input
                id={`nama-jalan-${currentKegiatan.id}`}
                value={currentKegiatan.namaJalan}
                onChange={(e) => updateCurrentKegiatan({ namaJalan: e.target.value })}
                placeholder="Masukkan nama jalan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`kecamatan-${currentKegiatan.id}`}>Kecamatan</Label>
              <Select value={currentKegiatan.kecamatan} onValueChange={handleKecamatanChange}>
                <SelectTrigger id={`kecamatan-${currentKegiatan.id}`}>
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
              <Label htmlFor={`kelurahan-${currentKegiatan.id}`}>Kelurahan</Label>
              <Select
                value={currentKegiatan.kelurahan}
                onValueChange={handleKelurahanChange}
                disabled={!kelurahanOptions.length}
              >
                <SelectTrigger id={`kelurahan-${currentKegiatan.id}`}>
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

          {/* Rencana/Realisasi Panjang/Volume (Conditional for Harian/Tersier) */}
          {(formData.reportType === "harian" || formData.reportType === "tersier") && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`rencana-panjang-${currentKegiatan.id}`}>Rencana Panjang (M)</Label>
                <Input
                  id={`rencana-panjang-${currentKegiatan.id}`}
                  value={currentKegiatan.rencanaPanjang || ""}
                  onChange={(e) => updateCurrentKegiatan({ rencanaPanjang: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`rencana-volume-${currentKegiatan.id}`}>Rencana Volume (M³)</Label>
                <Input
                  id={`rencana-volume-${currentKegiatan.id}`}
                  value={currentKegiatan.rencanaVolume || ""}
                  onChange={(e) => updateCurrentKegiatan({ rencanaVolume: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`realisasi-panjang-${currentKegiatan.id}`}>Realisasi Panjang (M)</Label>
                <Input
                  id={`realisasi-panjang-${currentKegiatan.id}`}
                  value={currentKegiatan.realisasiPanjang || ""}
                  onChange={(e) => updateCurrentKegiatan({ realisasiPanjang: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`realisasi-volume-${currentKegiatan.id}`}>Realisasi Volume (M³)</Label>
                <Input
                  id={`realisasi-volume-${currentKegiatan.id}`}
                  value={currentKegiatan.realisasiVolume || ""}
                  onChange={(e) => updateCurrentKegiatan({ realisasiVolume: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          )}

          {/* Measurements (Panjang, Lebar, Sedimen, Volume) (Conditional for Harian/Bulanan) */}
          {formData.reportType !== "tersier" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`panjang-${currentKegiatan.id}`}>Panjang Penanganan (M)</Label>
                <Input
                  id={`panjang-${currentKegiatan.id}`}
                  value={currentKegiatan.panjangPenanganan}
                  onChange={(e) => updateCurrentKegiatan({ panjangPenanganan: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`lebar-${currentKegiatan.id}`}>Lebar Rata-rata (M)</Label>
                <Input
                  id={`lebar-${currentKegiatan.id}`}
                  value={currentKegiatan.lebarRataRata}
                  onChange={(e) => updateCurrentKegiatan({ lebarRataRata: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`sedimen-${currentKegiatan.id}`}>Tinggi Rata-rata Sedimen (M)</Label>
                <Input
                  id={`sedimen-${currentKegiatan.id}`}
                  value={currentKegiatan.rataRataSedimen}
                  onChange={(e) => updateCurrentKegiatan({ rataRataSedimen: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`volume-${currentKegiatan.id}`}>Volume Galian (M³)</Label>
                <Input
                  id={`volume-${currentKegiatan.id}`}
                  value={currentKegiatan.volumeGalian}
                  onChange={(e) => updateCurrentKegiatan({ volumeGalian: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          )}

          {/* Aktifitas Penanganan Details Section */}
          {(formData.reportType === "harian" || formData.reportType === "bulanan") && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Detail Aktifitas Penanganan</h2>
              {currentKegiatan.aktifitasPenangananDetails.map((detail, detailIndex) => (
                <PenangananDetailSection
                  key={detail.id}
                  detail={detail}
                  index={detailIndex}
                  updateDetail={updateAktifitasPenangananDetail}
                  removeDetail={removeAktifitasPenangananDetail}
                  isRemovable={currentKegiatan.aktifitasPenangananDetails.length > 1}
                  reportType={formData.reportType}
                  onPreviewPhoto={(url) => { setPreviewUrl(url); setShowPreviewDialog(true); }}
                />
              ))}
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={addAktifitasPenangananDetail}>
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Aktifitas Penanganan
                </Button>
              </div>
            </div>
          )}

          {/* Peralatan Section */}
          <PeralatanSection
            currentKegiatan={currentKegiatan}
            updateCurrentKegiatan={updateCurrentKegiatan}
            peralatanCustomInputs={peralatanCustomInputs}
            setPeralatanCustomInputs={setPeralatanCustomInputs}
          />

          {/* Operasional Alat Berat Section (Conditional for Harian/Bulanan) */}
          {(formData.reportType === "harian" || formData.reportType === "bulanan") && (
            <OperasionalAlatBeratSection
              currentKegiatan={currentKegiatan}
              updateCurrentKegiatan={updateCurrentKegiatan}
              operasionalCustomInputs={operasionalCustomInputs}
              setOperasionalCustomInputs={setOperasionalCustomInputs}
            />
          )}

          {/* Koordinator & PHL */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`koordinator-${currentKegiatan.id}`}>Koordinator</Label>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded-md p-2">
                {koordinatorOptions.map((koordinator) => (
                  <div key={koordinator} className="flex items-center space-x-2">
                    <Checkbox
                      id={`koordinator-${currentKegiatan.id}-${koordinator}`}
                      checked={currentKegiatan.koordinator.includes(koordinator)}
                      onCheckedChange={() => toggleKoordinator(koordinator)}
                    />
                    <Label htmlFor={`koordinator-${currentKegiatan.id}-${koordinator}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {koordinator}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            {(formData.reportType === "harian" || formData.reportType === "bulanan") && (
              <div className="space-y-2">
                <Label htmlFor={`jumlah-phl-${currentKegiatan.id}`}>Jumlah PHL</Label>
                <Input
                  id={`jumlah-phl-${currentKegiatan.id}`}
                  type="text"
                  placeholder="0"
                  value={currentKegiatan.jumlahPHL === 0 ? "" : currentKegiatan.jumlahPHL.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d{0,2}$/.test(value)) {
                      updateCurrentKegiatan({ jumlahPHL: parseInt(value, 10) });
                    }
                  }}
                  maxLength={2}
                />
              </div>
            )}
          </div>

          {/* Kebutuhan Tenaga Kerja (UPT & P3SU) - Only for Tersier */}
          {formData.reportType === "tersier" && (
            <div className="grid gap-4 md:grid-cols-2 border rounded-lg p-4">
              <h3 className="font-semibold text-lg col-span-full">Kebutuhan Tenaga Kerja (Orang)</h3>
              <div className="space-y-2">
                <Label htmlFor={`jumlah-upt-${currentKegiatan.id}`}>UPT</Label>
                <Input
                  id={`jumlah-upt-${currentKegiatan.id}`}
                  type="text"
                  placeholder="0"
                  value={currentKegiatan.jumlahUPT === 0 ? "" : currentKegiatan.jumlahUPT?.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d{0,2}$/.test(value)) {
                      updateCurrentKegiatan({ jumlahUPT: parseInt(value, 10) || 0 });
                    }
                  }}
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`jumlah-p3su-${currentKegiatan.id}`}>P3SU</Label>
                <Input
                  id={`jumlah-p3su-${currentKegiatan.id}`}
                  type="text"
                  placeholder="0"
                  value={currentKegiatan.jumlahP3SU === 0 ? "" : currentKegiatan.jumlahP3SU?.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d{0,2}$/.test(value)) {
                      updateCurrentKegiatan({ jumlahP3SU: parseInt(value, 10) || 0 });
                    }
                  }}
                  maxLength={2}
                />
              </div>
            </div>
          )}

          {/* Sisa Target Penyelesaian Pekerjaan (Hari) - Only for Tersier */}
          {formData.reportType === "tersier" && (
            <div className="space-y-2">
              <Label htmlFor={`sisa-target-hari-${currentKegiatan.id}`}>Sisa Target Penyelesaian Pekerjaan (Hari)</Label>
              <Input
                id={`sisa-target-hari-${currentKegiatan.id}`}
                type="text"
                placeholder="00"
                value={currentKegiatan.sisaTargetHari || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || /^\d{0,2}$/.test(value)) {
                    updateCurrentKegiatan({ sisaTargetHari: value });
                  }
                }}
                maxLength={2}
              />
            </div>
          )}

          {/* Keterangan */}
          <div className="space-y-2">
            <Label htmlFor={`keterangan-${currentKegiatan.id}`}>Keterangan</Label>
            <Textarea
              id={`keterangan-${currentKegiatan.id}`}
              value={currentKegiatan.keterangan}
              onChange={(e) => updateCurrentKegiatan({ keterangan: e.target.value })}
              placeholder="Catatan tambahan (opsional)"
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 pt-4">
            <Button
              onClick={handlePrintPreview}
              variant="outline"
              className="flex-1 min-w-[150px]"
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview PDF {formData.reportType === "tersier" ? "Tersier" : "Harian"}
            </Button>
            <Button
              onClick={handlePrintDownload}
              variant="default"
              className="flex-1 min-w-[150px]"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF {formData.reportType === "tersier" ? "Tersier" : "Harian"}
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="flex-1 min-w-[150px]">
              {isSaving ? (
                <>Menyimpan...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
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