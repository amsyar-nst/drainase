import { useState, useEffect, useRef } from "react";
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
import { LaporanDrainase, KegiatanDrainase, Material, Peralatan, OperasionalAlatBerat } from "@/types/laporan";
import { kecamatanKelurahanData, koordinatorOptions, satuanOptions, materialDefaultUnits, peralatanOptions, materialOptions, alatBeratOptions } from "@/data/kecamatan-kelurahan";
import { toast } from "sonner";
import { generatePDF } from "@/lib/pdf-generator";
import { supabase } from "@/integrations/supabase/client";
import { OperasionalAlatBeratSection } from "./drainase-form/OperasionalAlatBeratSection";
import { PeralatanSection } from "./drainase-form/PeralatanSection"; // Import the new component
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList, CommandInput } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";

// Define predefined sedimen options for easier comparison
const predefinedSedimenOptions = [
  "Padat", "Cair", "Padat & Cair", "Batu", "Batu/Padat", "Batu/Cair",
  "Padat & Batu", "Padat/ Gulma & Sampah", "Padat/ Cair/Sampah", "Gulma/Rumput",
  "Batu/ Padat & Cair", "Sampah"
];

export const DrainaseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState<LaporanDrainase>({
    periode: format(new Date(), 'MMMM yyyy', { locale: idLocale }),
    reportType: "harian",
    kegiatans: [{
      id: "1",
      namaJalan: "",
      kecamatan: "",
      kelurahan: "",
      foto0: [],
      foto50: [],
      foto100: [],
      foto0Url: [],
      foto50Url: [],
      foto100Url: [],
      fotoSket: [],
      fotoSketUrl: [],
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
      // Tersier specific fields (now simplified based on request)
      jumlahUPT: 0,
      jumlahP3SU: 0,
      sisaTarget: "",
      rencanaPanjang: "",
      rencanaVolume: "",
      realisasiPanjang: "",
      realisasiVolume: "",
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
  
  const [selectedSedimenOption, setSelectedSedimenOption] = useState<string>("");
  const [customSedimen, setCustomSedimen] = useState("");

  const [koordinatorSearchTerm, setKoordinatorSearchTerm] = useState("");
  const [koordinatorPopoverOpen, setKoordinatorPopoverOpen] = useState(false);

  // State for individual activity date input string
  const [activityDateInputStrings, setActivityDateInputStrings] = useState<string[]>([]);

  // States for custom inputs for Material and Peralatan
  const [materialCustomInputs, setMaterialCustomInputs] = useState<Record<string, string>>({});
  const [peralatanCustomInputs, setPeralatanCustomInputs] = useState<Record<string, string>>({});
  // State for custom inputs for Operasional Alat Berat
  const [operasionalCustomInputs, setOperasionalCustomInputs] = useState<Record<string, string>>({});

  // New states for dragging
  const [isFoto0Dragging, setIsFoto0Dragging] = useState(false);
  const [isFoto50Dragging, setIsFoto50Dragging] = useState(false);
  const [isFoto100Dragging, setIsFoto100Dragging] = useState(false);
  const [isFotoSketDragging, setIsFotoSketDragging] = useState(false);


  const currentKegiatan = formData.kegiatans[currentKegiatanIndex];

  const lastCalculatedVolumeRef = useRef<string | null>(null);

  useEffect(() => {
    if (id) {
      loadLaporan(id);
    }
  }, [id]);

  useEffect(() => {
    if (formData.kegiatans.length > 0) {
      const currentKecamatan = formData.kegiatans[currentKegiatanIndex].kecamatan;
      setSelectedKecamatan(currentKecamatan);
      const selected = kecamatanKelurahanData.find((k) => k.kecamatan === currentKecamatan);
      setKelurahanOptions(selected?.kelurahan || []);

      // Update activity date input string for the current activity
      const newActivityDateInputStrings = [...activityDateInputStrings];
      newActivityDateInputStrings[currentKegiatanIndex] = currentKegiatan.hariTanggal 
        ? format(currentKegiatan.hariTanggal, "dd/MM/yyyy", { locale: idLocale }) 
        : "";
      setActivityDateInputStrings(newActivityDateInputStrings);

    } else {
      setSelectedKecamatan("");
      setKelurahanOptions([]);
      setActivityDateInputStrings([]);
    }
  }, [formData.kegiatans, currentKegiatanIndex]);

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
  }, [currentKegiatan.jenisSedimen, currentKegiatanIndex]);

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

  // Helper to process files from drop/paste
  const processAndAddFiles = (files: FileList, field: 'foto0' | 'foto50' | 'foto100' | 'fotoSket') => {
    const newFiles = Array.from(files);
    if (newFiles.length > 0) {
      updateCurrentKegiatan({ [field]: [...currentKegiatan[field], ...newFiles] });
    }
  };

  // Generic drag and paste handlers factory
  const createDragAndPasteHandlers = (setDraggingState: React.Dispatch<React.SetStateAction<boolean>>, field: 'foto0' | 'foto50' | 'foto100' | 'fotoSket') => ({
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDraggingState(true);
    },
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDraggingState(false);
    },
    onDrop: (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDraggingState(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processAndAddFiles(e.dataTransfer.files, field);
        e.dataTransfer.clearData();
      }
    },
    onPaste: (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (e.clipboardData.files && e.clipboardData.files.length > 0) {
        processAndAddFiles(e.clipboardData.files, field);
      }
    }
  });

  // Create handlers for each field
  const foto0Handlers = createDragAndPasteHandlers(setIsFoto0Dragging, 'foto0');
  const foto50Handlers = createDragAndPasteHandlers(setIsFoto50Dragging, 'foto50');
  const foto100Handlers = createDragAndPasteHandlers(setIsFoto100Dragging, 'foto100');
  const fotoSketHandlers = createDragAndPasteHandlers(setIsFotoSketDragging, 'fotoSket');


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
          if (materials.length === 0) {
            materials.push({ id: Date.now().toString() + '-mat', jenis: "", jumlah: "", satuan: "M³", keterangan: "" });
          }

          let peralatans = (peralatanRes.data || []).map(p => ({
            id: p.id,
            nama: p.nama,
            jumlah: p.jumlah,
            satuan: p.satuan || "Unit",
          }));
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
          if (operasionalAlatBerats.length === 0) {
            operasionalAlatBerats.push({
              id: Date.now().toString() + '-op',
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

          const ensureArray = (value: string | string[] | null | undefined): string[] => {
            if (Array.isArray(value)) {
              return value;
            }
            if (typeof value === 'string' && value) {
              return [value];
            }
            return [];
          };

          // Initialize custom input states for loaded data
          const initialMaterialCustomInputs: Record<string, string> = {};
          materials.forEach(m => {
            if (!materialOptions.includes(m.jenis) && m.jenis !== "") {
              initialMaterialCustomInputs[m.id] = m.jenis;
              m.jenis = "custom"; // Set select value to 'custom'
            }
          });
          setMaterialCustomInputs(initialMaterialCustomInputs);

          const initialPeralatanCustomInputs: Record<string, string> = {};
          peralatans.forEach(p => {
            if (!peralatanOptions.includes(p.nama) && p.nama !== "") {
              initialPeralatanCustomInputs[p.id] = p.nama;
              p.nama = "custom"; // Set select value to 'custom'
            }
          });
          setPeralatanCustomInputs(initialPeralatanCustomInputs);

          const initialOperasionalCustomInputs: Record<string, string> = {};
          operasionalAlatBerats.forEach(op => {
            if (!alatBeratOptions.includes(op.jenis) && op.jenis !== "") {
              initialOperasionalCustomInputs[op.id] = op.jenis;
              op.jenis = "custom"; 
            }
          });
          setOperasionalCustomInputs(initialOperasionalCustomInputs);

          return {
            id: kegiatan.id,
            namaJalan: kegiatan.nama_jalan,
            kecamatan: kegiatan.kecamatan,
            kelurahan: kegiatan.kelurahan,
            foto0: ensureArray(kegiatan.foto_0_url),
            foto50: ensureArray(kegiatan.foto_50_url),
            foto100: ensureArray(kegiatan.foto_100_url),
            fotoSket: ensureArray(kegiatan.foto_sket_url),
            foto0Url: ensureArray(kegiatan.foto_0_url),
            foto50Url: ensureArray(kegiatan.foto_50_url),
            foto100Url: ensureArray(kegiatan.foto_100_url),
            fotoSketUrl: ensureArray(kegiatan.foto_sket_url),
            jenisSaluran: (kegiatan.jenis_saluran || "") as "Terbuka" | "Tertutup" | "Terbuka & Tertutup" | "",
            jenisSedimen: (kegiatan.jenis_sedimen || "") as string,
            aktifitasPenanganan: kegiatan.aktifitas_penanganan || "",
            panjangPenanganan: kegiatan.panjang_penanganan || "",
            lebarRataRata: kegiatan.lebar_rata_rata || "",
            rataRataSedimen: kegiatan.rata_rata_sedimen || "",
            volumeGalian: kegiatan.volume_galian || "",
            materials: materials,
            peralatans: peralatans,
            operasionalAlatBerats: operasionalAlatBerats,
            koordinator: kegiatan.koordinator || [],
            jumlahPHL: kegiatan.jumlah_phl || 0,
            keterangan: kegiatan.keterangan,
            hariTanggal: kegiatan.hari_tanggal ? new Date(kegiatan.hari_tanggal) : new Date(),
            // Tersier specific fields
            jumlahUPT: kegiatan.jumlah_upt || 0,
            jumlahP3SU: kegiatan.jumlah_p3su || 0,
            sisaTarget: kegiatan.sisa_target || "",
            rencanaPanjang: kegiatan.rencana_panjang || "",
            rencanaVolume: kegiatan.rencana_volume || "",
            realisasiPanjang: kegiatan.realisasi_panjang || "",
            realisasiVolume: kegiatan.realisasi_volume || "",
          };
        })
      );

      setFormData({
        periode: laporanData.periode,
        reportType: (laporanData.report_type || "harian") as "harian" | "bulanan" | "tersier",
        kegiatans: kegiatansWithDetails.length > 0 ? kegiatansWithDetails : formData.kegiatans
      });

      if (kegiatansWithDetails.length > 0) {
        setCurrentKegiatanIndex(0); 
        setActivityDateInputStrings(kegiatansWithDetails.map(k => k.hariTanggal ? format(k.hariTanggal, "dd/MM/yyyy", { locale: idLocale }) : ""));
      } else {
        setCurrentKegiatanIndex(0);
        setActivityDateInputStrings([""]);
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

  const addKegiatan = () => {
    const newKegiatan: KegiatanDrainase = {
      id: Date.now().toString(),
      namaJalan: "",
      kecamatan: "",
      kelurahan: "",
      foto0: [],
      foto50: [],
      foto100: [],
      foto0Url: [],
      foto50Url: [],
      foto100Url: [],
      fotoSket: [],
      fotoSketUrl: [],
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
      // Tersier specific fields
      jumlahUPT: 0,
      jumlahP3SU: 0,
      sisaTarget: "",
      rencanaPanjang: "",
      rencanaVolume: "",
      realisasiPanjang: "",
      realisasiVolume: "",
    };
    setFormData({ ...formData, kegiatans: [...formData.kegiatans, newKegiatan] });
    setCurrentKegiatanIndex(formData.kegiatans.length);
    setActivityDateInputStrings([...activityDateInputStrings, format(newKegiatan.hariTanggal!, "dd/MM/yyyy", { locale: idLocale })]);
  };

  const removeKegiatan = (index: number) => {
    if (formData.kegiatans.length > 1) {
      const newKegiatans = formData.kegiatans.filter((_, i) => i !== index);
      setFormData({ ...formData, kegiatans: newKegiatans });
      const newActivityDateInputStrings = activityDateInputStrings.filter((_, i) => i !== index);
      setActivityDateInputStrings(newActivityDateInputStrings);
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
      setMaterialCustomInputs((prev) => {
        const newInputs = { ...prev };
        delete newInputs[id];
        return newInputs;
      });
    }
  };

  const updateMaterial = (id: string, field: keyof Material, value: string) => {
    updateCurrentKegiatan({
      materials: currentKegiatan.materials.map((m) => {
        if (m.id === id) {
          const updatedMaterial = { ...m, [field]: value };
          
          if (field === "jenis") {
            if (value === "custom") {
              updatedMaterial.jenis = "custom"; // Keep 'custom' in material.jenis to trigger conditional rendering
              setMaterialCustomInputs((prev) => ({ ...prev, [id]: "" })); // Initialize custom input to empty
            } else {
              // If a predefined option is selected, clear custom input
              setMaterialCustomInputs((prev) => {
                const newInputs = { ...prev };
                delete newInputs[id];
                return newInputs;
              });
              const normalizedJenis = value.toLowerCase().trim();
              const defaultUnit = materialDefaultUnits[normalizedJenis];
              if (defaultUnit) {
                updatedMaterial.satuan = defaultUnit;
              }
            }
          }
          
          return updatedMaterial;
        }
        return m;
      }),
    });
  };

  const updateMaterialCustomInput = (id: string, value: string) => {
    setMaterialCustomInputs((prev) => ({ ...prev, [id]: value }));
    // Also update the actual material.jenis in formData
    updateCurrentKegiatan({
      materials: currentKegiatan.materials.map((m) =>
        m.id === id ? { ...m, jenis: value } : m
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'foto0' | 'foto50' | 'foto100' | 'fotoSket') => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      updateCurrentKegiatan({ [field]: [...currentKegiatan[field], ...newFiles] });
    }
  };

  const removePhoto = (field: 'foto0' | 'foto50' | 'foto100' | 'fotoSket', indexToRemove: number) => {
    const updatedPhotos = currentKegiatan[field].filter((_, index) => index !== indexToRemove);
    updateCurrentKegiatan({ [field]: updatedPhotos });
  };

  const handlePrintPreview = async () => {
    if (formData.reportType === "tersier") {
      toast.error("Generator PDF untuk laporan Tersier tidak tersedia.");
      return;
    }

    // For preview, we can use the current date as a placeholder if hariTanggal is null
    const tempLaporanDate = currentKegiatan.hariTanggal || new Date(); 
    const laporanForPdf: LaporanDrainase = {
      periode: formData.periode,
      reportType: formData.reportType,
      kegiatans: formData.kegiatans.map(k => ({
        ...k,
        hariTanggal: k.hariTanggal || tempLaporanDate // Ensure hariTanggal is not null for PDF
      })),
    };
    try {
      let blob: Blob;
      // Only generate Harian or Bulanan PDF
      blob = await generatePDF(laporanForPdf, false);
      
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
    if (formData.reportType === "tersier") {
      toast.error("Generator PDF untuk laporan Tersier tidak tersedia.");
      return;
    }

    // For download, we can use the current date as a placeholder if hariTanggal is null
    const tempLaporanDate = currentKegiatan.hariTanggal || new Date();
    const laporanForPdf: LaporanDrainase = {
      periode: formData.periode,
      reportType: formData.reportType,
      kegiatans: formData.kegiatans.map(k => ({
        ...k,
        hariTanggal: k.hariTanggal || tempLaporanDate // Ensure hariTanggal is not null for PDF
      })),
    };
    try {
      // Only generate Harian or Bulanan PDF
      await generatePDF(laporanForPdf, true);
      
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

      // Ensure periode is set, default to current month/year if not explicitly set
      const finalPeriode = formData.periode || format(new Date(), 'MMMM yyyy', { locale: idLocale });

      if (currentLaporanId) {
        const { error: updateError } = await supabase
          .from('laporan_drainase')
          .update({
            periode: finalPeriode,
            report_type: formData.reportType,
          })
          .eq('id', currentLaporanId);

        if (updateError) throw updateError;

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
        const { data: laporanData, error: laporanError } = await supabase
          .from('laporan_drainase')
          .insert({
            periode: finalPeriode,
            report_type: formData.reportType,
          })
          .select()
          .single();

        if (laporanError) throw laporanError;
        currentLaporanId = laporanData.id;
        setLaporanId(currentLaporanId);
      }

      for (const kegiatan of formData.kegiatans) {
        let foto0Urls: string[] = [];
        let foto50Urls: string[] = [];
        let foto100Urls: string[] = [];
        let fotoSketUrls: string[] = [];

        // Handle photo uploads based on report type
        if (formData.reportType === "tersier") {
          foto0Urls = await uploadFiles(kegiatan.foto0, `${currentLaporanId}/${kegiatan.id}/0`);
          foto100Urls = await uploadFiles(kegiatan.foto100, `${currentLaporanId}/${kegiatan.id}/100`);
          // foto50 and fotoSket are not used for tersier input, so no upload needed
        } else {
          foto0Urls = await uploadFiles(kegiatan.foto0, `${currentLaporanId}/${kegiatan.id}/0`);
          foto50Urls = await uploadFiles(kegiatan.foto50, `${currentLaporanId}/${kegiatan.id}/50`);
          foto100Urls = await uploadFiles(kegiatan.foto100, `${currentLaporanId}/${kegiatan.id}/100`);
          fotoSketUrls = await uploadFiles(kegiatan.fotoSket, `${currentLaporanId}/${kegiatan.id}/sket`);
        }

        const { data: kegiatanData, error: kegiatanError } = await supabase
          .from('kegiatan_drainase')
          .insert({
            laporan_id: currentLaporanId,
            nama_jalan: kegiatan.namaJalan,
            kecamatan: kegiatan.kecamatan,
            kelurahan: kegiatan.kelurahan,
            foto_0_url: foto0Urls,
            foto_50_url: foto50Urls, // Will be empty for tersier
            foto_100_url: foto100Urls,
            foto_sket_url: fotoSketUrls, // Will be empty for tersier
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
            hari_tanggal: kegiatan.hariTanggal ? format(kegiatan.hariTanggal, 'yyyy-MM-dd') : null,
            // Tersier specific fields (now simplified)
            jumlah_upt: kegiatan.jumlahUPT,
            jumlah_p3su: kegiatan.jumlahP3SU,
            sisa_target: kegiatan.sisaTarget,
            rencana_panjang: kegiatan.rencanaPanjang,
            rencana_volume: kegiatan.rencanaVolume,
            realisasi_panjang: kegiatan.realisasiPanjang,
            realisasi_volume: kegiatan.realisasiVolume,
          })
          .select()
          .single();

        if (kegiatanError) throw kegiatanError;

        // Save materials only for non-tersier reports
        if (formData.reportType !== "tersier") {
          const materialsToInsert = kegiatan.materials.filter(m => m.jenis || m.jumlah || m.jenis || m.satuan).map(m => ({
            kegiatan_id: kegiatanData!.id,
            jenis: m.jenis === "custom" ? materialCustomInputs[m.id] || "" : m.jenis,
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
        }

        // Save peralatans and operasionalAlatBerats for all report types
        const peralatanToInsert = kegiatan.peralatans.filter(p => p.nama || p.jumlah).map(p => ({
          kegiatan_id: kegiatanData!.id,
          nama: p.nama === "custom" ? peralatanCustomInputs[p.id] || "" : p.nama,
          jumlah: p.jumlah,
          satuan: p.satuan,
        }));

        if (peralatanToInsert.length > 0) {
          const { error: peralatanError } = await supabase
            .from('peralatan_kegiatan')
            .insert(peralatanToInsert);

          if (peralatanError) throw peralatanError;
        }

        const operasionalAlatBeratsToInsert = kegiatan.operasionalAlatBerats.filter(o => o.jenis || o.jumlah || o.dexliteJumlah || o.pertaliteJumlah || o.bioSolarJumlah).map(o => ({
          kegiatan_id: kegiatanData!.id,
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

  const handleActivityDateInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    const newActivityDateInputStrings = [...activityDateInputStrings];
    newActivityDateInputStrings[index] = value;
    setActivityDateInputStrings(newActivityDateInputStrings);

    if (value === "") {
      updateCurrentKegiatan({ hariTanggal: null });
    } else {
      const parsedDate = parse(value, "dd/MM/yyyy", new Date(), { locale: idLocale });
      if (isValid(parsedDate)) {
        updateCurrentKegiatan({ hariTanggal: parsedDate });
        // Update main form periode based on the first activity's date if it's a new report
        if (!laporanId && index === 0) {
          setFormData((prev) => ({ ...prev, periode: format(parsedDate, 'MMMM yyyy', { locale: idLocale }) }));
        }
      }
    }
  };

  const handleActivityDateSelect = (date: Date | undefined, index: number) => {
    if (date) {
      updateCurrentKegiatan({ hariTanggal: date });
      const newActivityDateInputStrings = [...activityDateInputStrings];
      newActivityDateInputStrings[index] = format(date, "dd/MM/yyyy", { locale: idLocale });
      setActivityDateInputStrings(newActivityDateInputStrings);
      // Update main form periode based on the first activity's date if it's a new report
      if (!laporanId && index === 0) {
        setFormData((prev) => ({ ...prev, periode: format(date, 'MMMM yyyy', { locale: idLocale }) }));
      }
    } else {
      updateCurrentKegiatan({ hariTanggal: null });
      const newActivityDateInputStrings = [...activityDateInputStrings];
      newActivityDateInputStrings[index] = "";
      setActivityDateInputStrings(newActivityDateInputStrings);
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
              disabled={formData.reportType !== "bulanan"} // Only allow manual edit for monthly reports
            />
            {formData.reportType !== "bulanan" && (
              <p className="text-xs text-muted-foreground">
                Periode laporan otomatis diambil dari Hari/Tanggal Kegiatan pertama.
              </p>
            )}
          </div>

          {/* Hari/Tanggal Kegiatan (Only for Harian and Tersier) */}
          {(formData.reportType === "harian" || formData.reportType === "tersier") && (
            <div className="space-y-2">
              <Label htmlFor="hari-tanggal-kegiatan">Hari/Tanggal Kegiatan</Label>
              <div className="relative flex items-center">
                <Input
                  id="hari-tanggal-kegiatan"
                  value={activityDateInputStrings[currentKegiatanIndex] || ""}
                  onChange={(e) => handleActivityDateInputChange(e, currentKegiatanIndex)}
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
                      onSelect={(date) => handleActivityDateSelect(date, currentKegiatanIndex)}
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

          {/* Photos (Conditional for Harian/Bulanan vs Tersier) */}
          {formData.reportType !== "tersier" ? (
            <div className="grid gap-4 md:grid-cols-4">
              {/* Foto 0% */}
              <div 
                className={cn(
                  "space-y-2 border-2 border-dashed rounded-md p-4 transition-colors",
                  isFoto0Dragging ? "border-primary-foreground" : "border-gray-300"
                )}
                {...foto0Handlers}
              >
                <Label htmlFor="foto-0">Foto 0%</Label>
                <Input
                  id="foto-0"
                  type="file"
                  accept="image/*"
                  multiple
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
              <div 
                className={cn(
                  "space-y-2 border-2 border-dashed rounded-md p-4 transition-colors",
                  isFoto50Dragging ? "border-primary-foreground" : "border-gray-300"
                )}
                {...foto50Handlers}
              >
                <Label htmlFor="foto-50">Foto 50%</Label>
                <Input
                  id="foto-50"
                  type="file"
                  accept="image/*"
                  multiple
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
              <div 
                className={cn(
                  "space-y-2 border-2 border-dashed rounded-md p-4 transition-colors",
                  isFoto100Dragging ? "border-primary-foreground" : "border-gray-300"
                )}
                {...foto100Handlers}
              >
                <Label htmlFor="foto-100">Foto 100%</Label>
                <Input
                  id="foto-100"
                  type="file"
                  accept="image/*"
                  multiple
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
              {/* Foto Sket */}
              <div 
                className={cn(
                  "space-y-2 border-2 border-dashed rounded-md p-4 transition-colors",
                  isFotoSketDragging ? "border-primary-foreground" : "border-gray-300"
                )}
                {...fotoSketHandlers}
              >
                <Label htmlFor="foto-sket">Gambar Sket</Label>
                <Input
                  id="foto-sket"
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={(e) => handleFileChange(e, 'fotoSket')}
                />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(Array.isArray(currentKegiatan.fotoSket) ? currentKegiatan.fotoSket : []).map((photo, index) => (
                    <div key={index} className="relative group">
                      {typeof photo === 'string' && photo.endsWith('.pdf') ? (
                        <a 
                          href={photo} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center justify-center w-full h-24 bg-gray-100 rounded border text-blue-600 hover:underline"
                        >
                          <FileText className="h-8 w-8 mr-2" /> PDF {index + 1}
                        </a>
                      ) : (
                        <img 
                          src={
                            photo instanceof File 
                              ? URL.createObjectURL(photo)
                              : photo || ''
                          } 
                          alt={`Gambar Sket ${index + 1}`} 
                          className="w-full h-24 object-cover rounded border cursor-pointer"
                          onClick={() => {
                            const url = photo instanceof File 
                              ? URL.createObjectURL(photo)
                              : photo || '';
                            setPreviewUrl(url);
                            setShowPreviewDialog(true);
                          }}
                        />
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto('fotoSket', index)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Tersier specific photo inputs (Foto 0% and Foto 100%)
            <div className="grid gap-4 md:grid-cols-2">
              {/* Foto 0% (Sebelum) */}
              <div 
                className={cn(
                  "space-y-2 border-2 border-dashed rounded-md p-4 transition-colors",
                  isFoto0Dragging ? "border-primary-foreground" : "border-gray-300"
                )}
                {...foto0Handlers}
              >
                <Label htmlFor="foto-0-tersier">Foto 0% (Sebelum)</Label>
                <Input
                  id="foto-0-tersier"
                  type="file"
                  accept="image/*"
                  multiple
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
                        alt={`Foto 0% (Sebelum) ${index + 1}`}
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
              {/* Foto 100% (Sesudah) */}
              <div 
                className={cn(
                  "space-y-2 border-2 border-dashed rounded-md p-4 transition-colors",
                  isFoto100Dragging ? "border-primary-foreground" : "border-gray-300"
                )}
                {...foto100Handlers}
              >
                <Label htmlFor="foto-100-tersier">Foto 100% (Sesudah)</Label>
                <Input
                  id="foto-100-tersier"
                  type="file"
                  accept="image/*"
                  multiple
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
                        alt={`Foto 100% (Sesudah) ${index + 1}`}
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
          )}


          {/* Jenis Saluran & Sedimen (Conditional for Harian/Bulanan) */}
          {formData.reportType !== "tersier" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="jenis-saluran">Jenis Saluran</Label>
                <Select
                  value={currentKegiatan.jenisSaluran}
                  onValueChange={(value) => updateCurrentKegiatan({ jenisSaluran: value as "Terbuka" | "Tertutup" | "Terbuka & Tertutup" | "" })}
                >
                  <SelectTrigger id="jenis-saluran">
                    <SelectValue placeholder="-" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Removed SelectItem with empty value to fix Radix UI error */}
                    <SelectItem value="Terbuka">Terbuka</SelectItem>
                    <SelectItem value="Tertutup">Tertutup</SelectItem>
                    <SelectItem value="Terbuka & Tertutup">Terbuka & Tertutup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jenis-sedimen">Jenis Sedimen</Label>
                <Select
                  value={selectedSedimenOption}
                  onValueChange={(value) => {
                    setSelectedSedimenOption(value);
                    if (value === "custom") {
                      updateCurrentKegiatan({ jenisSedimen: customSedimen });
                    } else {
                      updateCurrentKegiatan({ jenisSedimen: value });
                      setCustomSedimen("");
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
                {selectedSedimenOption === "custom" && (
                  <Input
                    type="text"
                    placeholder="Masukkan jenis sedimen manual"
                    value={customSedimen}
                    onChange={(e) => {
                      setCustomSedimen(e.target.value);
                      updateCurrentKegiatan({ jenisSedimen: e.target.value });
                    }}
                    className="mt-2"
                  />
                )}
              </div>
            </div>
          )}

          {/* Aktifitas Penanganan (Conditional for Harian/Bulanan) */}
          {formData.reportType !== "tersier" && (
            <div className="space-y-2">
              <Label htmlFor="aktifitas">Aktifitas Penanganan</Label>
              <Input
                id="aktifitas"
                value={currentKegiatan.aktifitasPenanganan}
                onChange={(e) => updateCurrentKegiatan({ aktifitasPenanganan: e.target.value })}
                placeholder="Contoh: Pembersihan dan Pengerukan"
              />
            </div>
          )}

          {/* Rencana/Realisasi Panjang/Volume (Conditional for Harian/Tersier) */}
          {(formData.reportType === "harian" || formData.reportType === "tersier") && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rencana-panjang">Rencana Panjang (M)</Label>
                <Input
                  id="rencana-panjang"
                  value={currentKegiatan.rencanaPanjang || ""}
                  onChange={(e) => updateCurrentKegiatan({ rencanaPanjang: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rencana-volume">Rencana Volume (M³)</Label>
                <Input
                  id="rencana-volume"
                  value={currentKegiatan.rencanaVolume || ""}
                  onChange={(e) => updateCurrentKegiatan({ rencanaVolume: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="realisasi-panjang">Realisasi Panjang (M)</Label>
                <Input
                  id="realisasi-panjang"
                  value={currentKegiatan.realisasiPanjang || ""}
                  onChange={(e) => updateCurrentKegiatan({ realisasiPanjang: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="realisasi-volume">Realisasi Volume (M³)</Label>
                <Input
                  id="realisasi-volume"
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
          )}

          {/* Materials (Conditional for Harian/Bulanan) */}
          {formData.reportType !== "tersier" && (
            <div className="space-y-4">
              <Label>Material yang Digunakan</Label>
              {currentKegiatan.materials.map((material) => (
                <div key={material.id} className="grid gap-4 md:grid-cols-5 items-end">
                  <div className="space-y-2">
                    <Label>Jenis Material</Label>
                    <Select
                      value={materialOptions.includes(material.jenis) ? material.jenis : "custom"}
                      onValueChange={(value) => updateMaterial(material.id, "jenis", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materialOptions.map((jenis) => (
                          <SelectItem key={jenis} value={jenis}>
                            {jenis}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                    {material.jenis === "custom" ? (
                      <Input
                        type="text"
                        placeholder="Masukkan jenis material manual"
                        value={materialCustomInputs[material.id] || ""}
                        onChange={(e) => updateMaterialCustomInput(material.id, e.target.value)}
                        className="mt-2"
                      />
                    ) : null}
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
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Material
                </Button>
              </div>
            </div>
          )}

          {/* Peralatan Section (Conditional for Harian/Tersier) */}
          {(formData.reportType === "harian" || formData.reportType === "tersier") && (
            <PeralatanSection
              currentKegiatan={currentKegiatan}
              updateCurrentKegiatan={updateCurrentKegiatan}
              peralatanCustomInputs={peralatanCustomInputs}
              setPeralatanCustomInputs={setPeralatanCustomInputs}
            />
          )}

          {/* Operasional Alat Berat Section (Conditional for Harian/Tersier) */}
          {(formData.reportType === "harian" || formData.reportType === "tersier") && (
            <OperasionalAlatBeratSection
              currentKegiatan={currentKegiatan}
              updateCurrentKegiatan={updateCurrentKegiatan}
              operasionalCustomInputs={operasionalCustomInputs}
              setOperasionalCustomInputs={setOperasionalCustomInputs}
            />
          )}

          {/* Tersier Specific Fields (sisaTarget, jumlahUPT, jumlahP3SU) */}
          {formData.reportType === "tersier" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sisa-target">Sisa Target</Label>
                <Input
                  id="sisa-target"
                  value={currentKegiatan.sisaTarget || ""}
                  onChange={(e) => updateCurrentKegiatan({ sisaTarget: e.target.value })}
                  placeholder="Sisa target"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jumlah-upt">Jumlah Personil UPT</Label>
                <Input
                  id="jumlah-upt"
                  type="text"
                  placeholder="0"
                  value={currentKegiatan.jumlahUPT === 0 ? "" : currentKegiatan.jumlahUPT?.toString() || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d{0,2}$/.test(value)) {
                      updateCurrentKegiatan({ jumlahUPT: parseInt(value, 10) });
                    }
                  }}
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jumlah-p3su">Jumlah Personil P3SU</Label>
                <Input
                  id="jumlah-p3su"
                  type="text"
                  placeholder="0"
                  value={currentKegiatan.jumlahP3SU === 0 ? "" : currentKegiatan.jumlahP3SU?.toString() || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d{0,2}$/.test(value)) {
                      updateCurrentKegiatan({ jumlahP3SU: parseInt(value, 10) });
                    }
                  }}
                  maxLength={2}
                />
              </div>
            </div>
          )}

          {/* Koordinator & Jumlah PHL (Jumlah PHL always visible) */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="koordinator">Koordinator</Label>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded-md p-2">
                {koordinatorOptions.map((koordinator) => (
                  <div key={koordinator} className="flex items-center space-x-2">
                    <Checkbox
                      id={`koordinator-${koordinator}`}
                      checked={currentKegiatan.koordinator.includes(koordinator)}
                      onCheckedChange={() => toggleKoordinator(koordinator)}
                    />
                    <Label htmlFor={`koordinator-${koordinator}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {koordinator}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jumlah-phl">Jumlah PHL</Label>
              <Input
                id="jumlah-phl"
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
          <div className="flex flex-wrap gap-4 pt-4">
            <Button 
              onClick={handlePrintPreview} 
              variant="outline" 
              className="flex-1 min-w-[150px]"
              disabled={formData.reportType === "tersier"} // Disable if tersier
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview PDF {formData.reportType === "tersier" ? "Tersier" : "Harian"}
            </Button>
            <Button 
              onClick={handlePrintDownload} 
              variant="default" 
              className="flex-1 min-w-[150px]"
              disabled={formData.reportType === "tersier"} // Disable if tersier
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