export interface Material {
  id: string;
  jenis: string;
  jumlah: string;
  satuan: string;
  keterangan?: string;
  aktifitas_detail_id?: string; // New FK to aktifitas_penanganan_detail
}

export interface Peralatan {
  id: string;
  nama: string;
  jumlah: number;
  satuan: string;
}

export interface OperasionalAlatBerat {
  id: string;
  jenis: string;
  jumlah: number;
  dexliteJumlah: string;
  dexliteSatuan: string;
  pertaliteJumlah: string;
  pertaliteSatuan: string;
  bioSolarJumlah: string;
  bioSolarSatuan: string;
  keterangan: string;
}

// New interface for Aktifitas Penanganan Detail
export interface AktifitasPenangananDetail {
  id: string;
  kegiatanId?: string; // Foreign key to KegiatanDrainase
  jenisSaluran: "Terbuka" | "Tertutup" | "Terbuka & Tertutup" | "";
  jenisSedimen: string;
  aktifitasPenanganan: string;
  foto0: (File | string | null)[];
  foto50: (File | string | null)[];
  foto100: (File | string | null)[];
  fotoSket: (File | string | null)[];
  foto0Url?: string[]; // For URLs from DB
  foto50Url?: string[]; // For URLs from DB
  foto100Url?: string[]; // For URLs from DB
  fotoSketUrl?: string[]; // For URLs from DB
  materials: Material[]; // Materials are now nested under AktifitasPenangananDetail
}

export interface KegiatanDrainase {
  id: string;
  namaJalan: string;
  kecamatan: string;
  kelurahan: string;
  panjangPenanganan: string;
  lebarRataRata: string;
  rataRataSedimen: string;
  volumeGalian: string;
  peralatans: Peralatan[];
  operasionalAlatBerats: OperasionalAlatBerat[];
  koordinator: string[];
  jumlahPHL: number;
  keterangan: string;
  hariTanggal?: Date | null;
  
  // Tersier-specific fields
  jumlahUPT?: number;
  jumlahP3SU?: number;
  rencanaPanjang?: string;
  rencanaVolume?: string;
  realisasiPanjang?: string;
  realisasiVolume?: string;
  sisaTargetHari?: string;

  // Aktifitas Penanganan Details are now an array within KegiatanDrainase
  aktifitasPenangananDetails: AktifitasPenangananDetail[];
}

export interface LaporanDrainase {
  tanggal: Date | null;
  periode: string;
  reportType: "harian" | "bulanan" | "tersier";
  kegiatans: KegiatanDrainase[];
}