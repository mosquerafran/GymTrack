import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

import CalendarView from "../components/CalendarView";
import TrainingSelector from "../components/TrainingSelector";

export default function Home({ fecha, setFecha, user, abrirDetalle, grupoId }) {
  const [entrenos,setEntrenos]=useState({});
  const [categoriasMap, setCategoriasMap] = useState({});
  const [frase, setFrase] = useState("");

  const chistes = [
    "Levantá más pesado, ese palo de escoba no va a hacer que dejes de dar lástima.",
    "Si tuvieras la misma fuerza de voluntad para entrenar que para comer facturas, serías fisicoculturista.",
    "Tus piernas parecen dos escarbadientes a punto de romperse. Andá a la prensa.",
    "Transpirá ahora, capaz así disimulas un poco lo feo que sos cuando te sacás la remera.",
    "Ese peso lo levanta mi abuela... y está muerta hace 5 años.",
    "Anotá el entreno. Total nadie va a notar la diferencia en tu físico.",
    "Hacer piernas es como pagar impuestos: a nadie le gusta pero sino terminás dando pena en shortcito.",
    "Si tu técnica fuera buena no estarías tomando ibuprofeno como si fueran caramelos.",
    "Estás a un asado de tirar por la borda todo lo que hiciste hoy. ¡Metéle garra!"
  ];

  useEffect(()=>{
    setFrase(chistes[Math.floor(Math.random() * chistes.length)]);
    if(user) cargarEntrenosMes(fecha);
    cargarCategorias();

  },[user]);

  const cargarEntrenosMes = async (fechaActual) => {
  const inicioMes = new Date(fechaActual.getFullYear(),fechaActual.getMonth(),1);
  const finMes = new Date(fechaActual.getFullYear(),fechaActual.getMonth()+1,0);

  const inicioStr = inicioMes.toISOString().split("T")[0];
  const finStr = finMes.toISOString().split("T")[0];

  try{
    // Traemos todas las del usuario y filtramos por grupo en memoria
    const q = query(
      collection(db,"asistencias"),
      where("grupoId", "==", grupoId),
      where("userName","==",user.displayName),
      where("fecha",">=",inicioStr),
      where("fecha","<=",finStr)
    );

    const snap = await getDocs(q);
    const mapa = {};

    snap.forEach(doc=>{
      const data = doc.data();
      // Filtrar por grupo en memoria
      if (grupoId && data.grupoId && data.grupoId !== grupoId) return;
      const fecha = data.fecha;

      if(!mapa[fecha]) mapa[fecha]=[];
      mapa[fecha].push(data.categoriaId);
    });

    setEntrenos(mapa);

  }catch(err){
    console.error("❌ Error cargando entrenos:",err);
  }
};

const cargarCategorias = async () => {
  try {
    const snap = await getDocs(collection(db,"categorias"));
    const mapa = {};
    snap.forEach(doc=>{
      mapa[doc.id] = doc.data().nombre;
    });
    setCategoriasMap(mapa);
  } catch (err) {
    console.error("❌ Error cargando categorías:", err);
  }
};

  return (
    <div className="space-y-6">
      <div className="bg-surfaceHighlight/50 border border-borderBase p-4 rounded-xl text-center italic text-textMuted animate-fade-in relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary/50 group-hover:bg-primary transition-colors"></div>
        "{frase}"
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7">
          <CalendarView
            fecha={fecha}
            setFecha={setFecha}
            entrenos={entrenos}
            categoriasMap={categoriasMap}
            onMonthChange={cargarEntrenosMes}
          />
        </div>

        <div className="lg:col-span-5 relative">
          <div className="sticky top-24">
            <TrainingSelector fecha={fecha} user={user} grupoId={grupoId} />
          </div>
        </div>
      </div>
    </div>
  );
}