import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCvG9i8yOFWz3iKhmKXEfhR4Qx_uw5tI6w",
  authDomain: "gym-tracker-1aaba.firebaseapp.com",
  projectId: "gym-tracker-1aaba",
  storageBucket: "gym-tracker-1aaba.firebasestorage.app",
  messagingSenderId: "305434941610",
  appId: "1:305434941610:web:174ecc96f79d9c37c898d3"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export const initAuth = async () => {
  await setPersistence(auth, browserLocalPersistence);
};