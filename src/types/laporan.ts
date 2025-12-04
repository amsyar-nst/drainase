export interface Material {
  id: string;
  jenis: string;
  jumlah: string;
  satuan: string;
  keterangan?: string; // Added keterangan field
}

export interface Peralatan {
  id: string;
  nama: string;
  jumlah: number;
  satuan: string; // Added satuan field
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

export interface KegiatanDrainase {
  id: string;
  namaJalan: string;
  kecamatan: string;
  kelurahan: string;
  foto0: (File | string | null)[]; // Changed to array
  foto50: (File | string | null)[]; // Changed to array
  foto100: (File | string | null)[]; // Changed to array
  foto0Url?: string[]; // Changed to array
  foto50Url?: string[]; // Changed to array
  foto100Url?: string[]; // Changed to array
  jenisSaluran: "Terbuka" | "Tertutup" | "";
  jenisSedimen: "Padat" | "Cair" | "Padat & Cair" | "";
  aktifitasPenanganan: string;
  panjangPenanganan: string;
  lebarRataRata: string;
  rataRataSedimen: string;
  volumeGalian: string;
  materials: Material[];
  peralatans: Peralatan[];
  operasionalAlatBerats: OperasionalAlatBerat[];
  koordinator: string[]; // Changed to string array for multiple coordinators
  jumlahPHL: number;
  keterangan: string;
}

export interface LaporanDrainase {
  tanggal: Date | null; // Changed to allow null
  kegiatans: KegiatanDrainase[];
}