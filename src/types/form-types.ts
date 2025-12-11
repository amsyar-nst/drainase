import { Material } from "./laporan";

// Represents a single, repeatable 'aktifitas penanganan' block in the UI
export interface PenangananDetailFormState {
  id: string; // Unique ID for this detail block
  foto0: (File | string | null)[];
  foto50: (File | string | null)[];
  foto100: (File | string | null)[];
  fotoSket: (File | string | null)[];
  jenisSaluran: "Terbuka" | "Tertutup" | "Terbuka & Tertutup" | "";
  jenisSedimen: string;
  aktifitasPenanganan: string;
  materials: Material[];
  
  // UI-specific states for custom inputs within this detail block
  selectedSedimenOption: string;
  customSedimen: string;
  materialCustomInputs: Record<string, string>;
}