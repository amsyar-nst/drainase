import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';

export const compressImage = async (file: File): Promise<File | null> => {
  if (!file) {
    return null;
  }

  // Options for image compression
  const options = {
    maxSizeMB: 1,           // (max file size in MB)
    maxWidthOrHeight: 1920, // (max width or height in pixels)
    useWebWorker: true,     // (use web worker for faster compression)
    fileType: 'image/jpeg', // (output file type)
  };

  try {
    const compressedFile = await imageCompression(file, options);
    console.log(`Original file size: ${file.size / 1024 / 1024} MB`);
    console.log(`Compressed file size: ${compressedFile.size / 1024 / 1024} MB`);
    toast.info(`Gambar dikompres dari ${(file.size / 1024 / 1024).toFixed(2)}MB menjadi ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    toast.error('Gagal mengompres gambar.');
    return null;
  }
};