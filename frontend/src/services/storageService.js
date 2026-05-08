import { storage } from "../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";

/**
 * Comprime y sube una imagen a Firebase Storage
 * @param {File} file Archivo de imagen
 * @param {string} userId ID del usuario
 * @returns {Promise<string>} URL de descarga de la imagen
 */
export const subirFotoEntrenamiento = async (file, userId) => {
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
