import React, { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { obtenerMetaSemanal, actualizarMetaSemanal } from "../services/usuarioService";
import { META_SEMANAL_DEFAULT } from "../types";
import { Target, Loader } from "lucide-react";
import { Alerta } from "../config/alertas";

interface MetaSemanalConfigProps {
  user: User;
}

const OPCIONES = [1, 2, 3, 4, 5, 6, 7];

export default function MetaSemanalConfig({ user }: MetaSemanalConfigProps): React.ReactElement {
  const [meta, setMeta] = useState<number>(META_SEMANAL_DEFAULT);
  const [loading, setLoading] = useState<boolean>(true);
  const [guardando, setGuardando] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    obtenerMetaSemanal(user.email)
      .then(setMeta)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [user]);

  const elegir = async (valor: number) => {
    if (!user.email || valor === meta) return;
    const anterior = meta;
    setMeta(valor); // optimista
    setGuardando(valor);
    try {
      await actualizarMetaSemanal(user.email, valor); // el botón marcado ya es la confirmación
    } catch (e) {
      console.error(e);
      setMeta(anterior); // revertir si falla
      Alerta.fire({ titleText: "No se pudo guardar", text: "Revisá la conexión y probá de nuevo.", icon: "error", confirmButtonText: "Entendido" });
    } finally {
      setGuardando(null);
    }
  };

  return (
    <div className="glass-panel p-5 sm:p-6">
      <h3 className="font-heading text-lg uppercase tracking-wide text-textMain flex items-center gap-2">
        <Target size={20} className="text-accent" aria-hidden="true" /> Meta semanal
      </h3>
      <p className="text-textMuted text-sm mt-1 mb-4">
        ¿Cuántos días por semana querés entrenar? Se usa para tu % de la semana en el ranking.
      </p>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1.5">
          {OPCIONES.map((n) => {
            const activo = n === meta;
            return (
              <button
                key={n}
                onClick={() => elegir(n)}
                aria-pressed={activo}
                aria-label={`${n} días por semana`}
                className={`min-h-[48px] rounded-xl font-black scoreboard text-lg transition-colors flex items-center justify-center border ${
                  activo
                    ? "bg-textMain text-background border-transparent"
                    : "bg-surfaceHighlight/50 text-textMuted border-borderBase hover:text-textMain hover:border-primary/30"
                }`}
              >
                {guardando === n ? <Loader size={16} className="animate-spin" /> : n}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
