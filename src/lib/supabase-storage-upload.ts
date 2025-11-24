import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const uploadImageToSupabaseStorage = async (file: File, bucketName: string, folderPath: string): Promise<string | null> => {
  if (!file) {
    toast.error("Tidak ada file yang dipilih untuk diunggah.");
    return null;
  }

  const filePath = `${folderPath}/${file.name}`;

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Overwrite if file exists
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    toast.success("Foto berhasil diunggah ke Supabase Storage.");
    return publicUrlData.publicUrl;

  } catch (error: any) {
    console.error("Supabase Storage upload error:", error);
    toast.error(`Gagal mengunggah foto ke Supabase Storage: ${error.message}`);
    return null;
  }
};