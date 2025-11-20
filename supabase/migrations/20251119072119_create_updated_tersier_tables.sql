/*
  # Create Updated Tersier Tables with New Structure
  
  1. New Tables
    - laporan_drainase_tersier: Main report table with month/year
    - kegiatan_drainase_tersier: Activity details with updated structure
  
  2. Updated Structure for kegiatan_drainase_tersier:
    - Location fields: nama_jalan, kecamatan, kelurahan, kota
    - Split tenaga kerja: upt_count, p3su_count
    - Rencana dimensi: rencana_panjang, rencana_volume
    - Realisasi dimensi: realisasi_panjang, realisasi_volume
    - sisa_target_hari: target completion in days
    - penanggung_jawab: array for multi-select
    - alat_yang_dibutuhkan: array for equipment
    - jenis_sedimen: text for sediment type (allows custom input)
  
  3. Security
    - Enable RLS on both tables
    - Allow public access for all operations (as per existing pattern)
*/

-- Create update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create laporan_drainase_tersier table
CREATE TABLE IF NOT EXISTS laporan_drainase_tersier (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bulan TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kegiatan_drainase_tersier table with new structure
CREATE TABLE IF NOT EXISTS kegiatan_drainase_tersier (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  laporan_id UUID NOT NULL REFERENCES laporan_drainase_tersier(id) ON DELETE CASCADE,
  hari_tanggal DATE NOT NULL,
  
  -- Location fields
  nama_jalan TEXT NOT NULL DEFAULT '',
  kecamatan TEXT NOT NULL DEFAULT '',
  kelurahan TEXT NOT NULL DEFAULT '',
  kota TEXT NOT NULL DEFAULT 'Kota Medan',
  
  -- Sediment type (allows custom input)
  jenis_sedimen TEXT,
  
  -- Equipment (multi-select array)
  alat_yang_dibutuhkan TEXT[],
  
  -- Tenaga kerja split
  upt_count INTEGER NOT NULL DEFAULT 0,
  p3su_count INTEGER NOT NULL DEFAULT 0,
  
  -- Rencana dimensi
  rencana_panjang TEXT,
  rencana_volume TEXT,
  
  -- Realisasi dimensi
  realisasi_panjang TEXT,
  realisasi_volume TEXT,
  
  -- Sisa target in days
  sisa_target_hari TEXT,
  
  -- Penanggung jawab (multi-select array)
  penanggung_jawab TEXT[] NOT NULL DEFAULT '{}',
  
  -- Keterangan
  keterangan TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE laporan_drainase_tersier ENABLE ROW LEVEL SECURITY;
ALTER TABLE kegiatan_drainase_tersier ENABLE ROW LEVEL SECURITY;

-- Create policies for laporan_drainase_tersier
CREATE POLICY "Anyone can view laporan tersier"
  ON laporan_drainase_tersier
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert laporan tersier"
  ON laporan_drainase_tersier
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update laporan tersier"
  ON laporan_drainase_tersier
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete laporan tersier"
  ON laporan_drainase_tersier
  FOR DELETE
  USING (true);

-- Create policies for kegiatan_drainase_tersier
CREATE POLICY "Anyone can view kegiatan tersier"
  ON kegiatan_drainase_tersier
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert kegiatan tersier"
  ON kegiatan_drainase_tersier
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update kegiatan tersier"
  ON kegiatan_drainase_tersier
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete kegiatan tersier"
  ON kegiatan_drainase_tersier
  FOR DELETE
  USING (true);

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_laporan_drainase_tersier_updated_at ON laporan_drainase_tersier;
CREATE TRIGGER update_laporan_drainase_tersier_updated_at
  BEFORE UPDATE ON laporan_drainase_tersier
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kegiatan_drainase_tersier_updated_at ON kegiatan_drainase_tersier;
CREATE TRIGGER update_kegiatan_drainase_tersier_updated_at
  BEFORE UPDATE ON kegiatan_drainase_tersier
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();