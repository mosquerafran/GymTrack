import { auth } from "../firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import "../css/Login.css";

export default function Login() {

  const allowedEmails = [
    "mosquerafran265@gmail.com",
    "rravenna59@gmail.com",
    "pedrozaffino@gmail.com",
    "jgonzalezgalceran@gmail.com"
  ];

  const loginGoogle = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // ✅ Validar email permitido
      if (!allowedEmails.includes(user.email)) {
        alert("❌ No estás autorizado a entrar en esta app");
        await signOut(auth); // cerrar sesión inmediatamente
        return;
      }

      console.log("✅ Usuario autorizado:", user.email);

      // Aquí podés redirigir a la app, etc.

    } catch (error) {
      console.error("Error login Google:", error);
      alert("Error iniciando sesión");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-title">
          Gym Tracker 💪
        </div>

        <button className="google-button" onClick={loginGoogle}>
          <img
            className="google-icon"
            src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
            alt="Google"
          />
          Iniciar sesión con Google
        </button>
      </div>
    </div>
  );
}