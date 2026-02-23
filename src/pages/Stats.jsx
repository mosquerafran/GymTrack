import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import "../css/Stats.css";

export default function Stats({ user }) {
  const [stats, setStats] = useState([]);
  const [totalDias, setTotalDias] = useState(0);
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    if (user) cargarStats();
              cargarRanking();
  }, [user]);

  const cargarStats = async () => {
    // 1️⃣ categorías del usuario
    const qCat = query(
      collection(db, "categorias"),
      where("userId", "==", user.uid)
    );

    const snapCat = await getDocs(qCat);

    const categorias = snapCat.docs.map(d => ({
      id: d.id,
      nombre: d.data().nombre,
      cuenta: d.data().cuenta
    }));

    // mapa rapido
    const mapaCategorias = {};
    categorias.forEach(c => (mapaCategorias[c.id] = c));

    // 2️⃣ asistencias
    const qAsis = query(
      collection(db, "asistencias"),
      where("userId", "==", user.uid)
    );

    const snapAsis = await getDocs(qAsis);

    // 3️⃣ conteo por categoria
    const conteo = {};
    categorias.forEach(c => (conteo[c.id] = 0));

    // 4️⃣ dias que cuentan
    const diasQueCuentan = new Set();

    snapAsis.forEach(doc => {
      const data = doc.data();
      const cat = mapaCategorias[data.categoriaId];

      if (!cat) return;

      // sumar categoria SIEMPRE
      conteo[cat.id]++;

      // si cuenta → marcar dia
      if (cat.cuenta) {
        diasQueCuentan.add(data.fecha);
      }
    });

    // 5️⃣ preparar stats visibles
    const resultado = categorias.map(c => ({
      nombre: c.nombre,
      valor: conteo[c.id]
    }));

    setStats(resultado);
    setTotalDias(diasQueCuentan.size);
  };

 const cargarRanking = async () => {
  const snapCat = await getDocs(collection(db, "categorias"));
  const snapAsis = await getDocs(collection(db, "asistencias"));

  // mapa categoriaId -> categoria
  const mapaCategorias = {};
  snapCat.forEach(doc => {
    mapaCategorias[doc.id] = doc.data();
  });

  // estructura usuarios
  const usuarios = {};

  snapAsis.forEach(doc => {
    const data = doc.data();
    const user = data.userName;
    const cat = mapaCategorias[data.categoriaId];
    if (!cat) return;

    // crear usuario si no existe
    if (!usuarios[user]) {
      usuarios[user] = {
        nombre: user,
        dias: new Set(),
        categorias: {}
      };
    }

    // sumar categoria
    if (!usuarios[user].categorias[cat.nombre]) {
      usuarios[user].categorias[cat.nombre] = 0;
    }
    usuarios[user].categorias[cat.nombre]++;

    // sumar dia solo si cuenta
    if (cat.cuenta) {
      usuarios[user].dias.add(data.fecha);
    }
  });

  // transformar estructura
  const resultado = Object.values(usuarios).map(u => ({
    nombre: u.nombre,
    dias: u.dias.size,
    categorias: u.categorias
  }));

  setRanking(resultado);
};

  return (
    <div className="stats-container">
      <div className="stats-card">
        <div className="stats-title">Tus estadísticas 💪</div>

        <div className="stats-grid">
          <div className="stat">
            <div className="stat-value">{totalDias}</div>
            <div className="stat-label">Días entrenados</div>
          </div>

          {stats.map(s => (
            <div className="stat" key={s.nombre}>
              <div className="stat-value">{s.valor}</div>
              <div className="stat-label">{s.nombre}</div>
            </div>
          ))}
        </div>
        <div className="stats-subtitle"> Estadísticas de todos los usuarios</div>
        <div className="ranking">
          {ranking.map(user => (
            <div className="ranking-card" key={user.nombre}>
              <div className="ranking-name">{user.nombre}</div>
              <div>Días entrenados: {user.dias}</div>

              {Object.entries(user.categorias).map(([cat, val]) => (
                <div key={cat}>{cat}: {val}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}