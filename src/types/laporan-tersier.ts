export interface Alat {
  nama: string;
  jumlah: number;
}

export interface KegiatanDrainaseTersier {
  id: string;
  hariTanggal: Date;

  namaJalan: string;
  kecamatan: string;
  kelurahan: string;
  kota: string;

  jenisSedimen: string;

  alatYangDibutuhkan: Alat[];

  useUpt: boolean;
  uptCount: number;
  useP3su: boolean;
  p3suCount: number;

  rencanaPanjang: string;
  rencanaVolume: string;

  realisasiPanjang: string;
  realisasiVolume: string;

  sisaTargetHari: string;

  penanggungjawab: string[];

  keterangan: string;
}

export interface LaporanDrainaseTersier {
  bulan: string;
  kegiatans: KegiatanDrainaseTersier[];
}
