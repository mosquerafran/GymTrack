import { storage } from "../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";

/**
 * Comprime y sube una imagen a Firebase Storage
 */
export const subirFotoEntrenamiento = async (file: File, userId: string): Promise<string> => {
  try {
    // 1. Comprimir la imagen (Max 1MB, Max width/height 1024px)
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
      fileType: "image/jpeg"
    };
    
    const compressedFile = await imageCompression(file, options);
    
    // 2. Crear referencia única (carpeta por usuario)
    const timestamp = Date.now();
    const fileName = `entrenamientos/${userId}/${timestamp}.jpg`;
    const storageRef = ref(storage, fileName);
    
    // 3. Subir archivo
    const snapshot = await uploadBytes(storageRef, compressedFile);
    
    // 4. Obtener URL pública
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
    
  } catch (error) {
    console.error("Error al subir la foto:", error);
    throw new Error("No se pudo subir la foto del entrenamiento.");
  }
};
