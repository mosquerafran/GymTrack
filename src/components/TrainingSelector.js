import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  addDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import "../css/TrainingSelector.css";

import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

export default function TrainingSelector({ fecha, user }) {
  const [categorias, setCategorias] = useState([]);
  const [categoria, setCategoria] = useState("");

  useEffect(() => {
    if (user) cargarCategorias();
  }, [user]);

  const cargarCategorias = async () => {
    const q = query(
      collection(db, "categorias"),
      where("userId", "==", user.uid)
    );

    const snap = await getDocs(q);

    const datos = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    setCategorias(datos);

    if (datos.length) setCategoria(datos[0].id);
  };

  const guardar = async () => {
    if (!categoria) return;

    const fechaISO = fecha.toISOString().slice(0, 10);

    await addDoc(collection(db, "asistencias"), {
      userId: user.uid,
      userName: user.displayName,
      fecha: fechaISO,
      categoriaId: categoria
    });

    alert("Guardado 💪");
  };

  return (
    <div className="training-container">
      <p className="training-date">
        Día: <b>{fecha.toISOString().slice(0, 10)}</b>
      </p>

      <FormControl style={{ width: "80%", marginBottom: "2%" }}>
        <Select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          displayEmpty
        >
          {categorias.map(c => (
            <MenuItem key={c.id} value={c.id}>
              {c.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <button className="training-button" onClick={guardar}>
        Guardar entrenamiento 💪
      </button>
    </div>
  );
}