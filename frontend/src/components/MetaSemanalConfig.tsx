import React, { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { obtenerMetaSemanal, actualizarMetaSemanal } from "../services/usuarioService";
import { META_SEMANAL_DEFAULT } from "../types";
import { Target, Loader } from "lucide-react";
import Swal from "sweetalert2";

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
      await actualizarMetaSemanal(user.email, valor);
      Swal.fire({
        title: `Meta: ${valor} días/semana`,
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
        background: "var(--color-surface)",
        color: "var(--color-text-main)",
      });
    } catch (e) {
      console.error(e);
      setMeta(anterior); // revertir si falla
      Swal.fire({ title: "No se pudo guardar", icon: "error", background: "var(--color-surface)", color: "var(--color-text-main)" });
    } finally {
      setGuardando(null);
    }
  };

  return (
    <div className="glass-panel p-6 animate-slide-up">
      <h3 className="text-xl font-bold text-textMain mb-2 flex items-center gap-2">
        <Target className="text-primary" /> Meta semanal
      </h3>
      <p className="text-textMuted text-sm mb-5">
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
                className={`min-h-tap rounded-xl font-black scoreboard text-lg transition-all flex items-center justify-center border ${
                  activo
                    ? "bg-primary text-white border-transparent shadow-lg shadow-primary/25 scale-105"
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
