import { KegiatanDrainase } from "./laporan";

// This interface will be used to pass data to the monthly PDF generator
export interface LaporanBulananData {
  periode: string; // e.g., "Mei 2024"
  kegiatans: KegiatanDrainaseBulanan[]; // Activities for the month, each with its specific date
}

// Extend KegiatanDrainase to include the specific date of its parent report
export interface KegiatanDrainaseBulanan extends KegiatanDrainase {
  laporanTanggal: Date; // The specific date of the parent report for this activity
}