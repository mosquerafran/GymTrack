import { db } from "./firebase";
import { collection, getDocs, addDoc, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";

const DATA = {
  "mosquerafran265@gmail.com": ["Brazos", "Pull", "Futbol", "Pecho-Espalda", "Push", "Legs"],
  "pedrozaffino@gmail.com": ["Espalda-triceps", "Pecho-biceps", "Fútbol", "Pierna-hombro", "Brazos-hombro", "Pecho-espalda"],
  "jgonzalezgalceran@gmail.com": ["Running 🏳️‍🌈", "Torso", "Patas", "Empuje", "Minubi 🥵", "Tracción"],
  "rravenna59@gmail.com": ["Push", "Legs", "Hikking", "Pull", "Brazos"]
};

export async function restaurarCategoriasPersonales() {
  console.log("🚀 Iniciando restauración de categorías personales...");

  // 1. Obtener todos los usuarios de usuariosPendientes para tener sus UIDs
  const usersSnap = await getDocs(collection(db, "usuariosPendientes"));
  const emailToUid = {};
  usersSnap.forEach(d => {
    emailToUid[d.data().email] = d.id; // Asumimos que el ID del documento es el UID o el email? 
    // En App.js: await addDoc(collection(db, "usuariosPendientes"), { email: user.email, ... })
    // Ah, el ID es autogenerado. El email está adentro.
    emailToUid[d.data().email] = d.data().uid || d.id; 
  });
  
  // Francisco es especial
  emailToUid["mosquerafran265@gmail.com"] = "MIGRATE_ME"; // Tendremos que sacarlo del user logueado

  // 2. Por cada usuario en DATA
  for (const [email, cats] of Object.entries(DATA)) {
    console.log(`Processing ${email}...`);
    // ...
  }
}
