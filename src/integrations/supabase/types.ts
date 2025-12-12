export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      aktifitas_penanganan_detail: {
        Row: {
          aktifitas_penanganan: string | null
          created_at: string | null
          foto_0_url: string[] | null
          foto_100_url: string[] | null
          foto_50_url: string[] | null
          foto_sket_url: string[] | null
          id: string
          jenis_saluran: string | null
          jenis_sedimen: string | null
          kegiatan_id: string
          updated_at: string | null
        }
        Insert: {
          aktifitas_penanganan?: string | null
          created_at?: string | null
          foto_0_url?: string[] | null
          foto_100_url?: string[] | null
          foto_50_url?: string[] | null
          foto_sket_url?: string[] | null
          id?: string
          jenis_saluran?: string | null
          jenis_sedimen?: string | null
          kegiatan_id: string
          updated_at?: string | null
        }
        Update: {
          aktifitas_penanganan?: string | null
          created_at?: string | null
          foto_0_url?: string[] | null
          foto_100_url?: string[] | null
          foto_50_url?: string[] | null
          foto_sket_url?: string[] | null
          id?: string
          jenis_saluran?: string | null
          jenis_sedimen?: string | null
          kegiatan_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aktifitas_penanganan_detail_kegiatan_id_fkey",
            columns: ["kegiatan_id"],
            isOneToOne: false,
            referencedRelation: "kegiatan_drainase",
            referencedColumns: ["id"],
          },
        ]
      }
      kegiatan_drainase: {
        Row: {
          created_at: string
          id: string
          jumlah_phl: number | null
          jumlah_upt: number | null
          jumlah_p3su: number | null
          kecamatan: string
          kelurahan: string
          keterangan: string | null
          koordinator: string[] | null
          laporan_id: string
          lebar_rata_rata: string | null
          nama_jalan: string
          panjang_penanganan: string | null
          rata_rata_sedimen: string | null
          updated_at: string
          volume_galian: string | null
          hari_tanggal: string | null
          alat_yang_dibutuhkan: string[] | null
          rencana_panjang: string | null
          rencana_volume: string | null
          realisasi_panjang: string | null
          realisasi_volume: string | null
          sisa_target: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          jumlah_phl?: number | null
          jumlah_upt?: number | null
          jumlah_p3su?: number | null
          kecamatan: string
          kelurahan: string
          keterangan?: string | null
          koordinator?: string[] | null
          laporan_id: string
          lebar_rata_rata?: string | null
          nama_jalan: string
          panjang_penanganan?: string | null
          rata_rata_sedimen?: string | null
          updated_at?: string
          volume_galian?: string | null
          hari_tanggal?: string | null
          alat_yang_dibutuhkan?: string[] | null
          rencana_panjang?: string | null
          rencana_volume?: string | null
          realisasi_panjang?: string | null
          realisasi_volume?: string | null
          sisa_target?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          jumlah_phl?: number | null
          jumlah_upt?: number | null
          jumlah_p3su?: number | null
          kecamatan?: string
          kelurahan?: string
          keterangan?: string | null
          koordinator?: string[] | null
          laporan_id?: string
          lebar_rata_rata?: string | null
          nama_jalan?: string
          panjang_penanganan?: string | null
          rata_rata_sedimen?: string | null
          updated_at?: string
          volume_galian?: string | null
          hari_tanggal?: string | null
          alat_yang_dibutuhkan?: string[] | null
          rencana_panjang?: string | null
          rencana_volume?: string | null
          realisasi_panjang?: string | null
          realisasi_volume?: string | null
          sisa_target?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kegiatan_drainase_laporan_id_fkey",
            columns: ["laporan_id"],
            isOneToOne: false,
            referencedRelation: "laporan_drainase",
            referencedColumns: ["id"],
          },
        ]
      }
      kegiatan_drainase_tersier: {
        Row: {
          alat_yang_dibutuhkan: string[] | null
          created_at: string
          hari_tanggal: string
          id: string
          jenis_sedimen: string | null
          kebutuhan_tenaga_kerja: number | null
          keterangan: string | null
          laporan_id: string
          lebar: string | null
          lokasi: string
          panjang: string | null
          penanggungjawab: string | null
          sisa_target: string | null
          target_penyelesaian: string | null
          tinggi: string | null
          updated_at: string
          volume: string | null
          volume_per_hari: string | null
        }
        Insert: {
          alat_yang_dibutuhkan?: string[] | null
          created_at?: string
          hari_tanggal: string
          id?: string
          jenis_sedimen?: string | null
          kebutuhan_tenaga_kerja?: number | null
          keterangan?: string | null
          laporan_id: string
          lebar?: string | null
          lokasi: string
          panjang?: string | null
          penanggungjawab?: string | null
          sisa_target?: string | null
          target_penyelesaian?: string | null
          tinggi?: string | null
          updated_at?: string
          volume?: string | null
          volume_per_hari?: string | null
        }
        Update: {
          alat_yang_dibutuhkan?: string[] | null
          created_at?: string
          hari_tanggal?: string
          id?: string
          jenis_sedimen?: string | null
          kebutuhan_tenaga_kerja?: number | null
          keterangan?: string | null
          laporan_id?: string
          lebar?: string | null
          lokasi?: string
          panjang?: string | null
          penanggungjawab?: string | null
          sisa_target?: string | null
          target_penyelesaian?: string | null
          tinggi?: string | null
          updated_at?: string
          volume?: string | null
          volume_per_hari?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kegiatan_drainase_tersier_laporan_id_fkey",
            columns: ["laporan_id"],
            isOneToOne: false,
            referencedRelation: "laporan_drainase_tersier",
            referencedColumns: ["id"],
          },
        ]
      }
      laporan_drainase: {
        Row: {
          created_at: string
          id: string
          periode: string
          tanggal: string
          updated_at: string
          report_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          periode: string
          tanggal: string
          updated_at?: string
          report_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          periode?: string
          tanggal?: string
          updated_at?: string
          report_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "laporan_drainase_user_id_fkey",
            columns: ["user_id"],
            isOneToOne: false,
            referencedRelation: "users",
            referencedColumns: ["id"],
          },
        ]
      }
      laporan_drainase_tersier: {
        Row: {
          bulan: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          bulan: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          bulan?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      material_kegiatan: {
        Row: {
          aktifitas_detail_id: string | null
          created_at: string
          id: string
          jenis: string
          jumlah: string
          keterangan: string | null
          satuan: string
        }
        Insert: {
          aktifitas_detail_id?: string | null
          created_at?: string
          id?: string
          jenis: string
          jumlah: string
          keterangan?: string | null
          satuan: string
        }
        Update: {
          aktifitas_detail_id?: string | null
          created_at?: string
          id?: string
          jenis?: string
          jumlah?: string
          keterangan?: string | null
          satuan?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_kegiatan_aktifitas_detail_id_fkey",
            columns: ["aktifitas_detail_id"],
            isOneToOne: false,
            referencedRelation: "aktifitas_penanganan_detail",
            referencedColumns: ["id"],
          },
        ]
      }
      operasional_alat_berat_kegiatan: {
        Row: {
          bio_solar_jumlah: string | null
          bio_solar_satuan: string | null
          created_at: string | null
          dexlite_jumlah: string | null
          dexlite_satuan: string | null
          id: string
          jenis: string
          jumlah: number
          kegiatan_id: string
          keterangan: string | null
          pertalite_jumlah: string | null
          pertalite_satuan: string | null
        }
        Insert: {
          bio_solar_jumlah?: string | null
          bio_solar_satuan?: string | null
          created_at?: string | null
          dexlite_jumlah?: string | null
          dexlite_satuan?: string | null
          id?: string
          jenis: string
          jumlah: number
          kegiatan_id: string
          keterangan?: string | null
          pertalite_jumlah?: string | null
          pertalite_satuan?: string | null
        }
        Update: {
          bio_solar_jumlah?: string | null
          bio_solar_satuan?: string | null
          created_at?: string | null
          dexlite_jumlah?: string | null
          dexlite_satuan?: string | null
          id?: string
          jenis?: string
          jumlah?: number
          kegiatan_id?: string
          keterangan?: string | null
          pertalite_jumlah?: string | null
          pertalite_satuan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operasional_alat_berat_kegiatan_kegiatan_id_fkey",
            columns: ["kegiatan_id"],
            isOneToOne: false,
            referencedRelation: "kegiatan_drainase",
            referencedColumns: ["id"],
          },
        ]
      }
      peralatan_kegiatan: {
        Row: {
          created_at: string
          id: string
          jumlah: number
          kegiatan_id: string
          nama: string
          satuan: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          jumlah: number
          kegiatan_id: string
          nama: string
          satuan?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          jumlah?: number
          kegiatan_id?: string
          nama?: string
          satuan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "peralatan_kegiatan_kegiatan_id_fkey",
            columns: ["kegiatan_id"],
            isOneToOne: false,
            referencedRelation: "kegiatan_drainase",
            referencedColumns: ["id"],
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey",
            columns: ["id"],
            isOneToOne: true,
            referencedRelation: "users",
            referencedColumns: ["id"],
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
  }
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
      }
      ? U
      : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
      ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
          Update: infer U
        }
        ? U
        : never
      : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const