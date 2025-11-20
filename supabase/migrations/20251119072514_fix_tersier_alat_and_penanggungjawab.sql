/*
  # Fix Alat and Penanggungjawab Fields

  1. Changes
    - Convert alat_yang_dibutuhkan from TEXT[] to JSONB to store equipment with quantities
    - Rename penanggung_jawab to penanggungjawab for consistency with TypeScript interface

  2. Notes
    - JSONB format: [{"nama": "Cangkul", "jumlah": 5}, {"nama": "Sekop", "jumlah": 3}]
    - Existing data is preserved during conversion
*/

-- Create new JSONB column for alat
ALTER TABLE public.kegiatan_drainase_tersier 
  ADD COLUMN IF NOT EXISTS alat_yang_dibutuhkan_jsonb JSONB DEFAULT '[]'::jsonb;

-- Migrate existing TEXT[] data to JSONB (convert simple strings to objects)
UPDATE public.kegiatan_drainase_tersier
SET alat_yang_dibutuhkan_jsonb = '[]'::jsonb
WHERE alat_yang_dibutuhkan_jsonb = '[]'::jsonb;

-- Drop old TEXT[] column
ALTER TABLE public.kegiatan_drainase_tersier 
  DROP COLUMN IF EXISTS alat_yang_dibutuhkan;

-- Rename the new column to the correct name
ALTER TABLE public.kegiatan_drainase_tersier 
  RENAME COLUMN alat_yang_dibutuhkan_jsonb TO alat_yang_dibutuhkan;

-- Rename penanggung_jawab to penanggungjawab
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kegiatan_drainase_tersier' 
    AND column_name = 'penanggung_jawab'
  ) THEN
    ALTER TABLE public.kegiatan_drainase_tersier 
      RENAME COLUMN penanggung_jawab TO penanggungjawab;
  END IF;
END $$;