import { useState } from "react";
import { db } from "../firebase";
import { addDoc, collection } from "firebase/firestore";
import "../css/CategoriaCreator.css";

export default function CategoriaCreator({ user }) {
  const [nombre, setNombre] = useState("");
  const [cuenta, setCuenta] = useState(true);

  const guardar = async () => {
    if (!nombre.trim()) return;

    await addDoc(collection(db, "categorias"), {
      userId: user.uid,
      nombre,
      cuenta
    });

    setNombre("");
    setCuenta(true);
    alert("Categoría creada ✅");
  };

return (
  <div className="categoria-box">
    <h3 className="categoria-title">Tus categorías</h3>

    <input
      className="categoria-input"
      type="text"
      placeholder="Ej: Espalda Triceps"
      value={nombre}
      onChange={(e) => setNombre(e.target.value)}
    />

    <label className="categoria-checkbox">
      <input
        type="checkbox"
        checked={cuenta}
        onChange={(e) => setCuenta(e.target.checked)}
      />
      Cuenta en estadísticas
    </label>

    <br />

    <button className="categoria-button" onClick={guardar}>
      Crear categoría
    </button>
  </div>
);
}