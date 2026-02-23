import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

import CalendarView from "../components/CalendarView";
import TrainingSelector from "../components/TrainingSelector";

export default function Home({ fecha, setFecha, user, abrirDetalle }) {
  const [entrenos,setEntrenos]=useState({});
  const [categoriasMap, setCategoriasMap] = useState({});

  useEffect(()=>{
    if(user) cargarEntrenosMes(fecha);
    cargarCategorias();

  },[user]);

  const cargarEntrenosMes = async (fechaActual) => {
  console.log("📅 Cargando entrenos mes:", fechaActual);

  const inicioMes = new Date(fechaActual.getFullYear(),fechaActual.getMonth(),1);
  const finMes = new Date(fechaActual.getFullYear(),fechaActual.getMonth()+1,0);

  const inicioStr = inicioMes.toISOString().split("T")[0];
  const finStr = finMes.toISOString().split("T")[0];

  console.log("📆 Rango:", inicioStr,"→",finStr);
  console.log("👤 Usuario:", user.displayName);

  try{
    const q = query(
      collection(db,"asistencias"),
      where("userName","==",user.displayName),
      where("fecha",">=",inicioStr),
      where("fecha","<=",finStr)
    );

    console.log("📡 Ejecutando query...");

    const snap = await getDocs(q);

    console.log("📥 Docs recibidos:", snap.size);

    const mapa = {};

    snap.forEach(doc=>{
      const data = doc.data();
      console.log("📄 Doc:",data);

      const fecha = data.fecha;

      if(!mapa[fecha]) mapa[fecha]=[];
      mapa[fecha].push(data.categoriaId);
    });

    console.log("🗺️ Mapa final:", mapa);

    setEntrenos(mapa);

  }catch(err){
    console.error("❌ Error cargando entrenos:",err);
  }
};

const cargarCategorias = async () => {
  const snap = await getDocs(collection(db,"categorias"));

  const mapa = {};

  snap.forEach(doc=>{
    mapa[doc.id] = doc.data().nombre;
  });

  setCategoriasMap(mapa);
};

  return (
    <>
      <CalendarView
        fecha={fecha}
        setFecha={setFecha}
        entrenos={entrenos}
        categoriasMap={categoriasMap}
        onMonthChange={cargarEntrenosMes}
        abrirDetalle={abrirDetalle}

      />

      <TrainingSelector fecha={fecha} user={user} />
    </>
  );
}