-- Add UPDATE and DELETE policies for material_kegiatan
CREATE POLICY "Anyone can update materials"
ON public.material_kegiatan
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete materials"
ON public.material_kegiatan
FOR DELETE
TO public
USING (true);

-- Add UPDATE and DELETE policies for peralatan_kegiatan
CREATE POLICY "Anyone can update peralatan"
ON public.peralatan_kegiatan
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete peralatan"
ON public.peralatan_kegiatan
FOR DELETE
TO public
USING (true);