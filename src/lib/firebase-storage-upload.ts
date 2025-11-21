import { toast } from "sonner";
import { storage, ref, uploadBytes, getDownloadURL } from "@/integrations/firebase";

export const uploadImageToFirebaseStorage = async (file: File, folderPath: string): Promise<string | null> => {
  if (!file) {
    toast.error("Tidak ada file yang dipilih untuk diunggah.");
    return null;
  }

  const storageRef = ref(storage, `${folderPath}/${file.name}`);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    toast.success("Foto berhasil diunggah ke Firebase Storage.");
    return downloadURL;
  } catch (error: any) {
    console.error("Firebase Storage upload error:", error);
    toast.error(`Gagal mengunggah foto ke Firebase Storage: ${error.message}`);
    return null;
  }
};