import React, { lazy, Suspense, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { Loader, PersonStanding } from "lucide-react";
import { obtenerSexo, actualizarSexo } from "../services/usuarioService";
import { Sexo, SEXO_DEFAULT } from "../config/entrenos";
import { Alerta } from "../config/alertas";

const Cuerpo = lazy(() => import("./cuerpo/Cuerpo"));

interface SexoConfigProps {
  user: User;
}

const OPCIONES: { id: Sexo; nombre: string }[] = [
  { id: "hombre", nombre: "Hombre" },
  { id: "mujer", nombre: "Mujer" },
];

/** Elige el modelo del cuerpo (registro, muro y stats). Guarda en usuarios/{email}.sexo. */
export default function SexoConfig({ user }: SexoConfigProps): React.ReactElement {
  const [sexo, setSexo] = useState<Sexo>(SEXO_DEFAULT);
  const [guardando, setGuardando] = useState<Sexo | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    obtenerSexo(user.email).then(setSexo).catch((e) => console.error(e));
  }, [user]);

  const elegir = async (valor: Sexo) => {
    if (!user.email || valor === sexo) return;
    const anterior = sexo;
    setSexo(valor); // optimista
    setGuardando(valor);
    try {
      await actualizarSexo(user.email, valor);
    } catch (e) {
      console.error(e);
      setSexo(anterior);
      Alerta.fire({ titleText: "No se pudo guardar", text: "Revisá la conexión y probá de nuevo.", icon: "error", confirmButtonText: "Entendido" });
    } finally {
      setGuardando(null);
    }
  };

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-4">
      <div>
        <h3 className="font-heading text-lg uppercase tracking-wide text-textMain flex items-center gap-2">
          <PersonStanding size={20} className="text-primary" /> Tu cuerpo
        </h3>
        <p className="text-sm text-textMuted mt-1">El modelo que se usa al marcar músculos, en el muro y en tus stats.</p>
      </div>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Modelo del cuerpo">
        {OPCIONES.map((o) => {
          const activo = o.id === sexo;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => elegir(o.id)}
              aria-pressed={activo}
              className={`min-h-[64px] rounded-2xl border-[1.5px] flex items-center justify-center gap-3 font-heading text-base uppercase tracking-wide transition-colors ${activo ? "border-primary bg-primary/10 text-primary" : "border-borderBase bg-background text-textMain"}`}
            >
              <Suspense fallback={<span className="w-6 h-12" />}>
                <Cuerpo sexo={o.id} lado="front" etiqueta="" className="!w-6" />
              </Suspense>
              {guardando === o.id ? <Loader size={18} className="animate-spin" /> : o.nombre}
            </button>
          );
        })}
      </div>
    </div>
  );
}
