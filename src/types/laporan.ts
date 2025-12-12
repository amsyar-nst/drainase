export interface Material {
  id: string;
  jenis: string;
  jumlah: string;
  satuan: string;
  keterangan?: string;
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
  jenisSaluran: "Terbuka" | "Tertutup" | "Terbuka & Tertutup" | "";
  jenisSedimen: string;
  aktifitasPenanganan: string;
  foto0: (File | string | null)[];
  foto50: (File | string | null)[];
  foto100: (File | string | null)[];
  fotoSket: (File | string | null)[];
  foto0Url?: string[]; // For loaded URLs
  foto50Url?: string[];
  foto100Url?: string[];
  fotoSketUrl?: string[];
  materials: Material[]; // Materials are now linked to this detail
}

export interface KegiatanDrainase {
  id: string;
  namaJalan: string;
  kecamatan: string;
  kelurahan: string;
  // These fields are now moved to AktifitasPenangananDetail
  // foto0: (File | string | null)[];
  // foto50: (File | string | null)[];
  // foto100: (File | string | null)[];
  // foto0Url?: string[];
  // foto50Url?: string[];
  // foto100Url?: string[];
  // fotoSket: (File | string | null)[];
  // fotoSketUrl?: string[];
  // jenisSaluran: "Terbuka" | "Tertutup" | "Terbuka & Tertutup" | "";
  // jenisSedimen: string;
  // aktifitasPenanganan: string;
  // materials: Material[]; // Materials are now linked to AktifitasPenangananDetail

  aktifitasPenangananDetails: AktifitasPenangananDetail[]; // New array for multiple details

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
}

export interface LaporanDrainase {
  tanggal: Date | null;
  periode: string;
  reportType: "harian" | "bulanan" | "tersier";
  kegiatans: KegiatanDrainase[];
}