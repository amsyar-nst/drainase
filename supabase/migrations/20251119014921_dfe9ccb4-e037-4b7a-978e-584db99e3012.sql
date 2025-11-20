-- Create table for laporan drainase tersier
CREATE TABLE public.laporan_drainase_tersier (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bulan TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for kegiatan drainase tersier
CREATE TABLE public.kegiatan_drainase_tersier (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  laporan_id UUID NOT NULL REFERENCES public.laporan_drainase_tersier(id) ON DELETE CASCADE,
  hari_tanggal DATE NOT NULL,
  lokasi TEXT NOT NULL,
  jenis_sedimen TEXT,
  alat_yang_dibutuhkan TEXT[],
  kebutuhan_tenaga_kerja INTEGER DEFAULT 0,
  panjang TEXT,
  lebar TEXT,
  tinggi TEXT,
  volume TEXT,
  volume_per_hari TEXT,
  sisa_target TEXT,
  target_penyelesaian TEXT,
  penanggungjawab TEXT,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.laporan_drainase_tersier ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kegiatan_drainase_tersier ENABLE ROW LEVEL SECURITY;

-- Create policies for laporan_drainase_tersier
CREATE POLICY "Anyone can view laporan tersier"
  ON public.laporan_drainase_tersier
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert laporan tersier"
  ON public.laporan_drainase_tersier
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update laporan tersier"
  ON public.laporan_drainase_tersier
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete laporan tersier"
  ON public.laporan_drainase_tersier
  FOR DELETE
  USING (true);

-- Create policies for kegiatan_drainase_tersier
CREATE POLICY "Anyone can view kegiatan tersier"
  ON public.kegiatan_drainase_tersier
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert kegiatan tersier"
  ON public.kegiatan_drainase_tersier
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update kegiatan tersier"
  ON public.kegiatan_drainase_tersier
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete kegiatan tersier"
  ON public.kegiatan_drainase_tersier
  FOR DELETE
  USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_laporan_drainase_tersier_updated_at
  BEFORE UPDATE ON public.laporan_drainase_tersier
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kegiatan_drainase_tersier_updated_at
  BEFORE UPDATE ON public.kegiatan_drainase_tersier
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();