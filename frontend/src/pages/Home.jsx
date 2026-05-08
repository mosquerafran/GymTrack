import { useEffect, useState } from "react";
import { chisteRandom } from "../config/constants";
import { cargarAsistenciasMesUsuario } from "../services/asistenciasService";
import { cargarMapaCategorias } from "../services/categoriasService";

import CalendarView from "../components/CalendarView";
import TrainingSelector from "../components/TrainingSelector";

export default function Home({ fecha, setFecha, user, abrirDetalle, grupoId, theme }) {
  const [entrenos, setEntrenos] = useState({});
  const [categoriasMap, setCategoriasMap] = useState({});
  const [frase] = useState(() => chisteRandom());

  useEffect(() => {
    if (!user) return;
    cargarMes(fecha);
    cargarCategorias();
  }, [user]);

  const cargarMes = async (fechaActual) => {
    try {
      const mapa = await cargarAsistenciasMesUsuario(grupoId, user.displayName, fechaActual);
      setEntrenos(mapa);
    } catch (err) {
      console.error("❌ Error cargando entrenos:", err);
    }
  };

  const cargarCategorias = async () => {
    try {
      const mapa = await cargarMapaCategorias();
      setCategoriasMap(mapa);
    } catch (err) {
      console.error("❌ Error cargando categorías:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-surfaceHighlight/50 border border-borderBase p-4 rounded-xl text-center italic text-textMuted animate-fade-in relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary/50 group-hover:bg-primary transition-colors" />
        "{frase}"
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7">
          <CalendarView
            fecha={fecha}
            setFecha={setFecha}
            entrenos={entrenos}
            categoriasMap={categoriasMap}
            onMonthChange={cargarMes}
          />
        </div>

        <div className="lg:col-span-5 relative">
          <div className="sticky top-24">
            <TrainingSelector fecha={fecha} user={user} grupoId={grupoId} theme={theme} />
          </div>
        </div>
      </div>
    </div>
  );
}
