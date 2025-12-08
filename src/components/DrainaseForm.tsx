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
import { format, parse, isValid } from "date-fns"; // Import parse and isValid
import { id as idLocale } from "date-fns/locale";
import { CalendarIcon, Plus, Trash2, FileText, Eye, Save, List, Download, Check, XCircle } from "lucide-react"; // Added XCircle for removing photos
import { cn } from "@/lib/utils";
import { LaporanDrainase, KegiatanDrainase, Material, Peralatan, OperasionalAlatBerat } from "@/types/laporan";
import { kecamatanKelurahanData, koordinatorOptions, satuanOptions, materialDefaultUnits } from "@/data/kecamatan-kelurahan";
import { toast } from "sonner";
import { generatePDF } from "@/lib/pdf-generator"; // Updated import
import { supabase } from "@/integrations/supabase/client";
import { OperasionalAlatBeratSection } from "./drainase-form/OperasionalAlatBeratSection";
import { Command, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
// import { PrintSelectionDialog } from "./PrintSelectionDialog"; // Removed import

// Define predefined sedimen options for easier comparison
const predefinedSedimenOptions = [
  "Padat", "Cair", "Padat & Cair", "Batu", "Batu/Padat", "Batu/Cair",
  "Padat & Batu", "Padat & Sampah", "Padat/ Gulma & Sampah", "Padat/ Cair/Sampah", "Gulma/Rumput",
  "Batu/ Padat & Cair" // Add this new option
];

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
      foto0: [], // Changed to array
      foto50: [], // Changed to array
      foto100: [], // Changed to array
      foto0Url: [], // Changed to array
      foto50Url: [], // Changed to array
      foto100Url: [], // Changed to array
      jenisSaluran: "",
      jenisSedimen: "",
      aktifitasPenanganan: "",
      panjangPenanganan: "",
      lebarRataRata: "",
      rataRataSedimen: "",
      volumeGalian: "",
      materials: [{ id: "1", jenis: "", jumlah: "", satuan: "M³", keterangan: "" }],
      peralatans: [{ id: "1", nama: "", jumlah: 1, satuan: "Unit" }],
      operasionalAlatBerats: [{
        id: "1",
        jenis: "",
        jumlah: 0, // Default to 0 for empty display
        dexliteJumlah: "",
        dexliteSatuan: "Liter",
        pertaliteJumlah: "",
        pertaliteSatuan: "Liter",
        bioSolarJumlah: "",
        bioSolarSatuan: "Liter",
        keterangan: "",
      }],
      koordinator: [],
      jumlahPHL: 0, // Default to 0 for empty display
      keterangan: "",
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
  const [koordinatorPopoverOpen, setKoordinatorPopoverOpen] = useState(false);
  
  // New state to manage the selected value in the dropdown, including "custom"
  const [selectedSedimenOption, setSelectedSedimenOption] = useState<string>("");
  const [customSedimen, setCustomSedimen] = useState(""); // State for custom sedimen input

  // State for manual date input string
  const [dateInputString, setDateInputString] = useState<string>(
    formData.tanggal ? format(formData.tanggal, "dd/MM/yyyy", { locale: idLocale }) : ""
  );

  const currentKegiatan = formData.kegiatans[currentKegiatanIndex];

  useEffect(() => {
    if (id) {
      loadLaporan(id);
    }
  }, [id]);

  // Effect to synchronize selectedKecamatan and kelurahanOptions when formData.kegiatans or currentKegiatanIndex changes
  useEffect(() => {
    if (formData.kegiatans.length > 0) {
      const currentKecamatan = formData.kegiatans[currentKegiatanIndex].kecamatan;
      setSelectedKecamatan(currentKecamatan);
      const selected = kecamatanKelurahanData.find((k) => k.kecamatan === currentKecamatan);
      setKelurahanOptions(selected?.kelurahan || []);
    } else {
      setSelectedKecamatan("");
      setKelurahanOptions([]);
    }
  }, [formData.kegiatans, currentKegiatanIndex]);


  // Effect to synchronize dateInputString with formData.tanggal
  useEffect(() => {
    if (formData.tanggal) {
      setDateInputString(format(formData.tanggal, "dd/MM/yyyy", { locale: idLocale }));
    } else {
      setDateInputString("");
    }
  }, [formData.tanggal]);

  // Effect to initialize selectedSedimenOption and customSedimen when currentKegiatan changes (e.g., on load or activity switch)
  useEffect(() => {
    if (currentKegiatan.jenisSedimen) {
      if (predefinedSedimenOptions.includes(currentKegiatan.jenisSedimen)) {
        setSelectedSedimenOption(currentKegiatan.jenisSedimen);
        setCustomSedimen("");
      } else {
        setSelectedSedimenOption("custom");
        setCustomSedimen(currentKegiatan.jenisSedimen);
      }
    } else {
      setSelectedSedimenOption("");
      setCustomSedimen("");
    }
  }, [currentKegiatan.jenisSedimen, currentKegiatanIndex]); // Depend on currentKegiatan.jenisSedimen and currentKegiatanIndex

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

      // Load kegiatan with materials, peralatan, and operasional alat berat
      const kegiatansWithDetails = await Promise.all(
        (kegiatanData || []).map(async (kegiatan) => {
          const [materialsRes, peralatanRes, operasionalRes] = await Promise.all([
            supabase.from('material_kegiatan').select('*').eq('kegiatan_id', kegiatan.id),
            supabase.from('peralatan_kegiatan').select('*').eq('kegiatan_id', kegiatan.id),
            supabase.from('operasional_alat_berat_kegiatan').select('*').eq('kegiatan_id', kegiatan.id)
          ]);

          let materials = (materialsRes.data || []).map(m => ({
            id: m.id,
            jenis: m.jenis,
            jumlah: m.jumlah,
            satuan: m.satuan,
            keterangan: m.keterangan || "",
          }));
          // Ensure at least one empty material row if none exist
          if (materials.length === 0) {
            materials.push({ id: Date.now().toString() + '-mat', jenis: "", jumlah: "", satuan: "M³", keterangan: "" });
          }

          let peralatans = (peralatanRes.data || []).map(p => ({
            id: p.id,
            nama: p.nama,
            jumlah: p.jumlah,
            satuan: p.satuan || "Unit",
          }));
          // Ensure at least one empty peralatan row if none exist
          if (peralatans.length === 0) {
            peralatans.push({ id: Date.now().toString() + '-per', nama: "", jumlah: 1, satuan: "Unit" });
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
          // Ensure at least one empty operasional alat berat row if none exist
          if (operasionalAlatBerats.length === 0) {
            operasionalAlatBerats.push({
              id: Date.now().toString() + '-op',
              jenis: "",
              jumlah: 0, // Default to 0
              dexliteJumlah: "",
              dexliteSatuan: "Liter",
              pertaliteJumlah: "",
              pertaliteSatuan: "Liter",
              bioSolarJumlah: "",
              bioSolarSatuan: "Liter",
              keterangan: "",
            });
          }

          // Helper function to ensure photo URLs are always arrays
          const ensureArray = (value: string | string[] | null | undefined): string[] => {
            if (Array.isArray(value)) {
              return value;
            }
            if (typeof value === 'string' && value) {
              return [value];
            }
            return [];
          };

          return {
            id: kegiatan.id,
            namaJalan: kegiatan.nama_jalan,
            kecamatan: kegiatan.kecamatan,
            kelurahan: kegiatan.kelurahan,
            foto0: ensureArray(kegiatan.foto_0_url),
            foto50: ensureArray(kegiatan.foto_50_url),
            foto100: ensureArray(kegiatan.foto_100_url),
            foto0Url: ensureArray(kegiatan.foto_0_url),
            foto50Url: ensureArray(kegiatan.foto_50_url),
            foto100Url: ensureArray(kegiatan.foto_100_url),
            jenisSaluran: (kegiatan.jenis_saluran || "") as "Terbuka" | "Tertutup" | "Terbuka & Tertutup" | "",
            jenisSedimen: (kegiatan.jenis_sedimen || "") as "Padat" | "Cair" | "Padat & Cair" | "Batu" | "Batu/Padat" | "Batu/Cair" | "Padat & Batu" | "Padat & Sampah" | "Padat/ Gulma & Sampah" | "Padat/ Cair/Sampah" | "Gulma/Rumput" | "" | "Batu/ Padat & Cair",
            aktifitasPenanganan: kegiatan.aktifitas_penanganan || "",
            panjangPenanganan: kegiatan.panjang_penanganan || "",
            lebarRataRata: kegiatan.lebar_rata_rata || "",
            rataRataSedimen: kegiatan.rata_rata_sedimen || "",
            volumeGalian: kegiatan.volume_galian || "",
            materials: materials,
            peralatans: peralatans,
            operasionalAlatBerats: operasionalAlatBerats,
            koordinator: kegiatan.koordinator || [],
            jumlahPHL: kegiatan.jumlah_phl || 0, // Default to 0
            keterangan: kegiatan.keterangan || "",
          };
        })
      );

      setFormData({
        tanggal: new Date(laporanData.tanggal),
        kegiatans: kegiatansWithDetails.length > 0 ? kegiatansWithDetails : formData.kegiatans
      });

      // Explicitly set to the first activity after loading
      if (kegiatansWithDetails.length > 0) {
        setCurrentKegiatanIndex(0); 
      } else {
        setCurrentKegiatanIndex(0); // If no activities, still show the first (empty) one
      }

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
      foto0: [], // Changed to array
      foto50: [], // Changed to array
      foto100: [], // Changed to array
      foto0Url: [], // Changed to array
      foto50Url: [], // Changed to array
      foto100Url: [], // Changed to array
      jenisSaluran: "",
      jenisSedimen: "",
      aktifitasPenanganan: "",
      panjangPenanganan: "",
      lebarRataRata: "",
      rataRataSedimen: "",
      volumeGalian: "",
      materials: [{ id: "1", jenis: "", jumlah: "", satuan: "M³", keterangan: "" }],
      peralatans: [{ id: "1", nama: "", jumlah: 1, satuan: "Unit" }],
      operasionalAlatBerats: [{
        id: "1",
        jenis: "",
        jumlah: 0, // Default to 0
        dexliteJumlah: "",
        dexliteSatuan: "Liter",
        pertaliteJumlah: "",
        pertaliteSatuan: "Liter",
        bioSolarJumlah: "",
        bioSolarSatuan: "Liter",
        keterangan: "",
      }],
      koordinator: [],
      jumlahPHL: 0, // Default to 0
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
    updateCurrentKegiatan({ kecamatan: value, kelurahan: "" });
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
      keterangan: "",
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
      satuan: "Unit",
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

  // New function to upload multiple files
  const uploadFiles = async (files: (File | string | null)[], basePath: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    for (const fileOrUrl of files) {
      if (fileOrUrl instanceof File) {
        // New file, upload it
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
        // Existing URL, just add it
        uploadedUrls.push(fileOrUrl);
      }
    }
    return uploadedUrls;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'foto0' | 'foto50' | 'foto100') => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      updateCurrentKegiatan({ [field]: [...currentKegiatan[field], ...newFiles] });
    }
  };

  const removePhoto = (field: 'foto0' | 'foto50' | 'foto100', indexToRemove: number) => {
    const updatedPhotos = currentKegiatan[field].filter((_, index) => index !== indexToRemove);
    updateCurrentKegiatan({ [field]: updatedPhotos });
  };

  // New functions for print preview and download, compatible with old generatePDF
  const handlePrintPreview = async () => {
    if (!formData.tanggal) {
      toast.error("Mohon isi tanggal laporan.");
      return;
    }
    const laporanForPdf: LaporanDrainase = { // Use LaporanDrainase type
      tanggal: formData.tanggal,
      kegiatans: formData.kegiatans, // No need for laporanTanggal on individual kegiatans
    };
    try {
      const blob = await generatePDF(laporanForPdf, false); // Call old generatePDF, downloadNow=false
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
    if (!formData.tanggal) {
      toast.error("Mohon isi tanggal laporan.");
      return;
    }
    const laporanForPdf: LaporanDrainase = { // Use LaporanDrainase type
      tanggal: formData.tanggal,
      kegiatans: formData.kegiatans, // No need for laporanTanggal on individual kegiatans
    };
    try {
      await generatePDF(laporanForPdf, true); // Call old generatePDF, downloadNow=true
      toast.success("Laporan berhasil diunduh.");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Gagal mengunduh PDF.");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let currentLaporanId = laporanId;

      if (!formData.tanggal) {
        toast.error("Mohon isi tanggal laporan.");
        setIsSaving(false);
        return;
      }

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

        // Delete existing related data to re-insert
        // Fetch all kegiatan IDs associated with this laporan
        const { data: existingKegiatanIds, error: fetchKegiatanIdsError } = await supabase
          .from('kegiatan_drainase')
          .select('id')
          .eq('laporan_id', currentLaporanId);

        if (fetchKegiatanIdsError) throw fetchKegiatanIdsError;

        const idsToDelete = existingKegiatanIds.map(k => k.id);

        if (idsToDelete.length > 0) {
          await supabase.from('material_kegiatan').delete().in('kegiatan_id', idsToDelete);
          await supabase.from('peralatan_kegiatan').delete().in('kegiatan_id', idsToDelete);
          await supabase.from('operasional_alat_berat_kegiatan').delete().in('kegiatan_id', idsToDelete);
          await supabase.from('kegiatan_drainase').delete().in('id', idsToDelete);
        }

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
        const foto0Urls = await uploadFiles(kegiatan.foto0, `${currentLaporanId}/${kegiatan.id}/0`);
        const foto50Urls = await uploadFiles(kegiatan.foto50, `${currentLaporanId}/${kegiatan.id}/50`);
        const foto100Urls = await uploadFiles(kegiatan.foto100, `${currentLaporanId}/${kegiatan.id}/100`);

        // Insert kegiatan
        const { data: kegiatanData, error: kegiatanError } = await supabase
          .from('kegiatan_drainase')
          .insert({
            laporan_id: currentLaporanId,
            nama_jalan: kegiatan.namaJalan,
            kecamatan: kegiatan.kecamatan,
            kelurahan: kegiatan.kelurahan,
            foto_0_url: foto0Urls, // Now an array
            foto_50_url: foto50Urls, // Now an array
            foto_100_url: foto100Urls, // Now an array
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
        const materialsToInsert = kegiatan.materials.filter(m => m.jenis || m.jumlah || m.satuan).map(m => ({ // Filter out empty rows
          kegiatan_id: kegiatanData.id,
          jenis: m.jenis,
          jumlah: m.jumlah,
          satuan: m.satuan,
          keterangan: m.keterangan,
        }));

        if (materialsToInsert.length > 0) {
          const { error: materialsError } = await supabase
            .from('material_kegiatan')
            .insert(materialsToInsert);

          if (materialsError) throw materialsError;
        }

        // Insert peralatan
        const peralatanToInsert = kegiatan.peralatans.filter(p => p.nama || p.jumlah).map(p => ({ // Filter out empty rows
          kegiatan_id: kegiatanData.id,
          nama: p.nama,
          jumlah: p.jumlah,
          satuan: p.satuan,
        }));

        if (peralatanToInsert.length > 0) {
          const { error: peralatanError } = await supabase
            .from('peralatan_kegiatan')
            .insert(peralatanToInsert);

          if (peralatanError) throw peralatanError;
        }

        // Insert operasional alat berat
        const operasionalAlatBeratsToInsert = kegiatan.operasionalAlatBerats.filter(o => o.jenis || o.jumlah || o.dexliteJumlah || o.pertaliteJumlah || o.bioSolarJumlah).map(o => ({ // Filter out empty rows
          kegiatan_id: kegiatanData.id,
          jenis: o.jenis,
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
          const { error: operasionalError } = await supabase
            .from('operasional_alat_berat_kegiatan')
            .insert(operasionalAlatBeratsToInsert);

          if (operasionalError) throw operasionalError;
        }
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

  // Handler for manual date input change
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateInputString(value);

    if (value === "") {
      setFormData((prev) => ({ ...prev, tanggal: null }));
    } else {
      const parsedDate = parse(value, "dd/MM/yyyy", new Date(), { locale: idLocale });
      if (isValid(parsedDate)) {
        setFormData((prev) => ({ ...prev, tanggal: parsedDate }));
      }
    }
  };

  // Handler for date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, tanggal: date }));
      setDateInputString(format(date, "dd/MM/yyyy", { locale: idLocale }));
    } else {
      setFormData((prev) => ({ ...prev, tanggal: null }));
      setDateInputString("");
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
            <div className="relative flex items-center">
              <Input
                id="tanggal"
                value={dateInputString}
                onChange={handleDateInputChange}
                placeholder="dd/MM/yyyy"
                className={cn(
                  "w-full justify-start text-left font-normal pr-10", // Add padding-right for icon
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
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.tanggal || undefined}
                    onSelect={handleDateSelect}
                    initialFocus
                    locale={idLocale}
                  />
                </PopoverContent>
              </Popover>
            </div>
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
            {/* Foto 0% */}
            <div className="space-y-2">
              <Label htmlFor="foto-0">Foto 0%</Label>
              <Input
                id="foto-0"
                type="file"
                accept="image/*"
                multiple // Allow multiple files
                onChange={(e) => handleFileChange(e, 'foto0')}
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(Array.isArray(currentKegiatan.foto0) ? currentKegiatan.foto0 : []).map((photo, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={
                        photo instanceof File 
                          ? URL.createObjectURL(photo)
                          : photo || ''
                      } 
                      alt={`Foto 0% ${index + 1}`} 
                      className="w-full h-24 object-cover rounded border cursor-pointer"
                      onClick={() => {
                        const url = photo instanceof File 
                          ? URL.createObjectURL(photo)
                          : photo || '';
                        setPreviewUrl(url);
                        setShowPreviewDialog(true);
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePhoto('foto0', index)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            {/* Foto 50% */}
            <div className="space-y-2">
              <Label htmlFor="foto-50">Foto 50%</Label>
              <Input
                id="foto-50"
                type="file"
                accept="image/*"
                multiple // Allow multiple files
                onChange={(e) => handleFileChange(e, 'foto50')}
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(Array.isArray(currentKegiatan.foto50) ? currentKegiatan.foto50 : []).map((photo, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={
                        photo instanceof File 
                          ? URL.createObjectURL(photo)
                          : photo || ''
                      } 
                      alt={`Foto 50% ${index + 1}`} 
                      className="w-full h-24 object-cover rounded border cursor-pointer"
                      onClick={() => {
                        const url = photo instanceof File 
                          ? URL.createObjectURL(photo)
                          : photo || '';
                        setPreviewUrl(url);
                        setShowPreviewDialog(true);
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePhoto('foto50', index)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            {/* Foto 100% */}
            <div className="space-y-2">
              <Label htmlFor="foto-100">Foto 100%</Label>
              <Input
                id="foto-100"
                type="file"
                accept="image/*"
                multiple // Allow multiple files
                onChange={(e) => handleFileChange(e, 'foto100')}
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(Array.isArray(currentKegiatan.foto100) ? currentKegiatan.foto100 : []).map((photo, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={
                        photo instanceof File 
                          ? URL.createObjectURL(photo)
                          : photo || ''
                      } 
                      alt={`Foto 100% ${index + 1}`} 
                      className="w-full h-24 object-cover rounded border cursor-pointer"
                      onClick={() => {
                        const url = photo instanceof File 
                          ? URL.createObjectURL(photo)
                          : photo || '';
                        setPreviewUrl(url);
                        setShowPreviewDialog(true);
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePhoto('foto100', index)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Jenis Saluran & Sedimen */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jenis-saluran">Jenis Saluran</Label>
              <Select
                value={currentKegiatan.jenisSaluran}
                onValueChange={(value) => updateCurrentKegiatan({ jenisSaluran: value as "Terbuka" | "Tertutup" | "Terbuka & Tertutup" | "" })}
              >
                <SelectTrigger id="jenis-saluran">
                  <SelectValue placeholder="Pilih jenis saluran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Terbuka">Terbuka</SelectItem>
                  <SelectItem value="Tertutup">Tertutup</SelectItem>
                  <SelectItem value="Terbuka & Tertutup">Terbuka & Tertutup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jenis-sedimen">Jenis Sedimen</Label>
              <Select
                value={selectedSedimenOption} // Use selectedSedimenOption here
                onValueChange={(value) => {
                  setSelectedSedimenOption(value);
                  if (value === "custom") {
                    updateCurrentKegiatan({ jenisSedimen: customSedimen }); // Set to current custom input value
                  } else {
                    updateCurrentKegiatan({ jenisSedimen: value as "Padat" | "Cair" | "Padat & Cair" | "Batu" | "Batu/Padat" | "Batu/Cair" | "Padat & Batu" | "Padat & Sampah" | "Padat/ Gulma & Sampah" | "Padat/ Cair/Sampah" | "Gulma/Rumput" | "" | "Batu/ Padat & Cair" });
                    setCustomSedimen(""); // Clear custom input if a predefined option is selected
                  }
                }}
              >
                <SelectTrigger id="jenis-sedimen">
                  <SelectValue placeholder="Pilih jenis sedimen" />
                </SelectTrigger>
                <SelectContent>
                  {predefinedSedimenOptions.map((jenis) => (
                    <SelectItem key={jenis} value={jenis}>
                      {jenis}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Lainnya</SelectItem>
                </SelectContent>
              </Select>
              {selectedSedimenOption === "custom" && ( // Conditional rendering based on selectedSedimenOption
                <Input
                  type="text"
                  placeholder="Masukkan jenis sedimen manual"
                  value={customSedimen}
                  onChange={(e) => {
                    setCustomSedimen(e.target.value);
                    updateCurrentKegiatan({ jenisSedimen: e.target.value }); // Update actual data with manual input
                  }}
                  className="mt-2"
                />
              )}
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
            <Label>Material yang Digunakan</Label>
            {currentKegiatan.materials.map((material) => (
              <div key={material.id} className="grid gap-4 md:grid-cols-5 items-end">
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
                <div className="space-y-2">
                  <Label>Keterangan</Label>
                  <Input
                    value={material.keterangan || ""}
                    onChange={(e) => updateMaterial(material.id, "keterangan", e.target.value)}
                    placeholder="Catatan material (opsional)"
                  />
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
            <div className="flex justify-end"> {/* Moved button here */}
              <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
                <Plus className="h-4 w-4 mr-1" />
                Tambah Material
              </Button>
            </div>
          </div>

          {/* Peralatan */}
          <div className="space-y-4">
            <Label>Peralatan yang Digunakan</Label>
            {currentKegiatan.peralatans.map((peralatan) => (
              <div key={peralatan.id} className="grid gap-4 md:grid-cols-4 items-end">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nama Peralatan</Label>
                  <Input
                    value={peralatan.nama}
                    onChange={(e) => updatePeralatan(peralatan.id, "nama", e.target.value)}
                    placeholder="" 
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
                <div className="space-y-2">
                  <Label>Satuan</Label>
                  <Select
                    value={peralatan.satuan}
                    onValueChange={(value) => updatePeralatan(peralatan.id, "satuan", value)}
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
                  onClick={() => removePeralatan(peralatan.id)}
                  disabled={currentKegiatan.peralatans.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex justify-end"> {/* Moved button here */}
              <Button type="button" variant="outline" size="sm" onClick={addPeralatan}>
                <Plus className="h-4 w-4 mr-1" />
                Tambah Peralatan
              </Button>
            </div>
          </div>

          {/* Operasional Alat Berat Section */}
          <OperasionalAlatBeratSection
            currentKegiatan={currentKegiatan}
            updateCurrentKegiatan={updateCurrentKegiatan}
          />

          {/* Koordinator & PHL */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="koordinator">Koordinator</Label>
              <Popover open={koordinatorPopoverOpen} onOpenChange={setKoordinatorPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={koordinatorPopoverOpen}
                    className="w-full justify-between"
                  >
                    {currentKegiatan.koordinator.length > 0
                      ? currentKegiatan.koordinator.join(", ")
                      : "Pilih koordinator..."}
                    <List className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {koordinatorOptions.map((koordinator) => (
                        <CommandItem
                          key={koordinator}
                          onSelect={() => toggleKoordinator(koordinator)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              currentKegiatan.koordinator.includes(koordinator)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {koordinator}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jumlah-phl">Jumlah PHL</Label>
              <Input
                id="jumlah-phl"
                type="text" // Changed to text
                placeholder="0"
                value={currentKegiatan.jumlahPHL === 0 ? "" : currentKegiatan.jumlahPHL.toString()} // Display empty if 0
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    updateCurrentKegiatan({ jumlahPHL: 0 }); // Save as 0 if empty
                  } else if (/^\d{0,2}$/.test(value)) { // Allow 0 to 2 digits
                    updateCurrentKegiatan({ jumlahPHL: parseInt(value, 10) });
                  }
                }}
                maxLength={2} // Add maxLength attribute
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
            <Button 
              onClick={handlePrintPreview} 
              variant="outline" 
              className="flex-1"
            >
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
            <Button 
              onClick={handlePrintDownload} 
              variant="default" 
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
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