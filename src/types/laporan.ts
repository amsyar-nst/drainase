export interface Material {
  id: string;
  jenis: string;
  jumlah: string;
  satuan: string;
}

export interface Peralatan {
  id: string;
  nama: string;
  jumlah: number;
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
  materials: Material[];
  peralatans: Peralatan[];
  koordinator: string;
  jumlahPHL: number;
  keterangan: string;
}

export interface LaporanDrainase {
  tanggal: Date;
  kegiatans: KegiatanDrainase[];
}
