export interface Material {
  id: string;
  jenis: string;
  jumlah: string;
  satuan: string;
  keterangan: string; // New property
}

export interface Peralatan {
  id: string;
  nama: string;
  jumlah: number;
  satuan: string; // New property
}

export interface OperasionalAlatBerat { // New interface
  id: string;
  jenis: string;
  jumlah: number;
  dexliteJumlah: string; // New property for Dexlite quantity
  dexliteSatuan: string; // New property for Dexlite unit
  pertaliteJumlah: string; // New property for Pertalite quantity
  pertaliteSatuan: string; // New property for Pertalite unit
  bioSolarJumlah: string; // New property for Bio Solar quantity
  bioSolarSatuan: string; // New property for Bio Solar unit
  keterangan: string; // New property for general notes
}

export interface KegiatanDrainase {
  id: string;
  namaJalan: string;
  kecamatan: string;
  kelurahan: string;
  foto0: File | string | null;
  foto50: File | string | null;
  foto100: File | string | null;
  foto0Url?: string;
  foto50Url?: string;
  foto100Url?: string;
  jenisSaluran: "Terbuka" | "Tertutup" | "";
  jenisSedimen: "Padat" | "Cair" | "Padat & Cair" | "";
  aktifitasPenanganan: string;
  panjangPenanganan: string;
  lebarRataRata: string;
  rataRataSedimen: string;
  volumeGalian: string;
  isVolumeGalianManuallySet?: boolean;
  materials: Material[];
  peralatans: Peralatan[];
  operasionalAlatBerats: OperasionalAlatBerat[]; // New property
  koordinator: string[]; // Changed to array of strings
  jumlahPHL: number;
  keterangan: string;
}

export interface LaporanDrainase {
  tanggal: Date;
  kegiatans: KegiatanDrainase[];
}