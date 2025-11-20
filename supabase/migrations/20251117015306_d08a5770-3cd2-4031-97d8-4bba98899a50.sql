-- Create storage bucket for laporan photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('laporan-photos', 'laporan-photos', true);

-- Create storage policies for photos
CREATE POLICY "Public can view laporan photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'laporan-photos');

CREATE POLICY "Anyone can upload laporan photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'laporan-photos');

CREATE POLICY "Anyone can update laporan photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'laporan-photos');

CREATE POLICY "Anyone can delete laporan photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'laporan-photos');

-- Create storage bucket for PDF reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('laporan-pdfs', 'laporan-pdfs', true);

-- Create storage policies for PDFs
CREATE POLICY "Public can view PDF reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'laporan-pdfs');

CREATE POLICY "Anyone can upload PDF reports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'laporan-pdfs');

CREATE POLICY "Anyone can delete PDF reports"
ON storage.objects FOR DELETE
USING (bucket_id = 'laporan-pdfs');

-- Create table for laporan drainase
CREATE TABLE public.laporan_drainase (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tanggal DATE NOT NULL,
  periode TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for kegiatan drainase
CREATE TABLE public.kegiatan_drainase (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  laporan_id UUID NOT NULL REFERENCES public.laporan_drainase(id) ON DELETE CASCADE,
  nama_jalan TEXT NOT NULL,
  kecamatan TEXT NOT NULL,
  kelurahan TEXT NOT NULL,
  foto_0_url TEXT,
  foto_50_url TEXT,
  foto_100_url TEXT,
  jenis_saluran TEXT,
  jenis_sedimen TEXT,
  aktifitas_penanganan TEXT,
  panjang_penanganan TEXT,
  lebar_rata_rata TEXT,
  rata_rata_sedimen TEXT,
  volume_galian TEXT,
  koordinator TEXT,
  jumlah_phl INTEGER DEFAULT 1,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for materials
CREATE TABLE public.material_kegiatan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kegiatan_id UUID NOT NULL REFERENCES public.kegiatan_drainase(id) ON DELETE CASCADE,
  jenis TEXT NOT NULL,
  jumlah TEXT NOT NULL,
  satuan TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for peralatan
CREATE TABLE public.peralatan_kegiatan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kegiatan_id UUID NOT NULL REFERENCES public.kegiatan_drainase(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  jumlah INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.laporan_drainase ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kegiatan_drainase ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_kegiatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peralatan_kegiatan ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no authentication required)
CREATE POLICY "Anyone can view laporan drainase"
ON public.laporan_drainase FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert laporan drainase"
ON public.laporan_drainase FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update laporan drainase"
ON public.laporan_drainase FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete laporan drainase"
ON public.laporan_drainase FOR DELETE
USING (true);

CREATE POLICY "Anyone can view kegiatan drainase"
ON public.kegiatan_drainase FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert kegiatan drainase"
ON public.kegiatan_drainase FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update kegiatan drainase"
ON public.kegiatan_drainase FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete kegiatan drainase"
ON public.kegiatan_drainase FOR DELETE
USING (true);

CREATE POLICY "Anyone can view materials"
ON public.material_kegiatan FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert materials"
ON public.material_kegiatan FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view peralatan"
ON public.peralatan_kegiatan FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert peralatan"
ON public.peralatan_kegiatan FOR INSERT
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_laporan_drainase_updated_at
BEFORE UPDATE ON public.laporan_drainase
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kegiatan_drainase_updated_at
BEFORE UPDATE ON public.kegiatan_drainase
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();