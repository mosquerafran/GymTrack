import React, { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { chisteRandom } from "../config/constants";
import { cargarAsistenciasMesUsuario } from "../services/asistenciasService";
import { cargarMapaCategorias } from "../services/categoriasService";
import { Categoria } from "../types";

import CalendarView from "../components/CalendarView";
import TrainingSelector from "../components/TrainingSelector";

interface HomeProps {
  fecha: Date;
  setFecha: (date: Date) => void;
  user: User;
  abrirDetalle: (date: Date) => void;
  grupoId: string;
  theme: "dark" | "light";
}

export default function Home({ fecha, setFecha, user, abrirDetalle, grupoId }: HomeProps): React.ReactElement {
  const [entrenos, setEntrenos] = useState<Record<string, string[]>>({});
  const [categoriasMap, setCategoriasMap] = useState<Record<string, Categoria>>({});
  const [frase] = useState<string>(() => chisteRandom());

  useEffect(() => {
    if (!user) return;
    cargarMes(fecha);
    cargarCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const cargarMes = async (fechaActual: Date) => {
    try {
      const mapa = await cargarAsistenciasMesUsuario(grupoId, user.displayName || "Usuario", fechaActual);
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

      {/* En el celu, registrar va primero (es a lo que se entra en el gym); en escritorio, a la derecha. */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-7 order-2 lg:order-1">
          <CalendarView
            fecha={fecha}
            setFecha={setFecha}
            entrenos={entrenos}
            categoriasMap={categoriasMap}
            onMonthChange={cargarMes}
          />
        </div>

        <div className="lg:col-span-5 relative order-1 lg:order-2">
          <div className="lg:sticky lg:top-24">
            <TrainingSelector
              fecha={fecha}
              user={user}
              grupoId={grupoId}
              onCompletado={() => cargarMes(fecha)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
