import React, { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { Check, Plus } from "lucide-react";
import { chisteRandom } from "../config/constants";
import { cargarAsistenciasMesUsuario } from "../services/asistenciasService";
import { obtenerMetaSemanal } from "../services/usuarioService";
import { formatDateLocal, inicioSemanaLocal } from "../utils/date";
import { META_SEMANAL_DEFAULT } from "../types";
import CalendarView from "../components/CalendarView";

interface HomeProps {
  user: User;
  grupoId: string;
  onRegistrar: (fecha: Date) => void;
  onAbrirDia: (fecha: Date) => void;
  /** Aumenta cuando se guarda o borra un entreno, para recargar. */
  refresco: number;
}

const DIAS = ["L", "M", "M", "J", "V", "S", "D"];

/** Inicio: registrar hoy (primero, sin scrollear), la semana contra la meta y el calendario. */
export default function Home({ user, grupoId, onRegistrar, onAbrirDia, refresco }: HomeProps): React.ReactElement {
  const [mesVisible, setMesVisible] = useState<Date>(new Date());
  const [entrenosMes, setEntrenosMes] = useState<Record<string, string[]>>({});
  const [diasSemana, setDiasSemana] = useState<Set<string>>(new Set());
  const [meta, setMeta] = useState<number>(META_SEMANAL_DEFAULT);
  const [frase] = useState<string>(() => chisteRandom());

  const hoy = new Date();
  const hoyStr = formatDateLocal(hoy);
  const lunes = inicioSemanaLocal(hoy);
  const semana = DIAS.map((_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return formatDateLocal(d);
  });
  const nombre = user.displayName || "Usuario";

  // Semana en curso (puede empezar en el mes anterior).
  const cargarSemana = async () => {
    try {
      const meses = [hoy];
      if (lunes.getMonth() !== hoy.getMonth()) meses.push(lunes);
      const mapas = await Promise.all(meses.map((m) => cargarAsistenciasMesUsuario(grupoId, nombre, m)));
      const dias = new Set<string>();
      for (const mapa of mapas) for (const [f, lista] of Object.entries(mapa)) if (lista.length) dias.add(f);
      setDiasSemana(dias);
    } catch (err) {
      console.error("Error cargando la semana:", err);
    }
  };

  const cargarMes = async (m: Date) => {
    try {
      setEntrenosMes(await cargarAsistenciasMesUsuario(grupoId, nombre, m));
    } catch (err) {
      console.error("Error cargando el mes:", err);
    }
  };

  useEffect(() => {
    cargarSemana();
    cargarMes(mesVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupoId, refresco]);

  useEffect(() => {
    if (user.email) obtenerMetaSemanal(user.email).then(setMeta).catch(() => {});
  }, [user.email]);

  const hechoHoy = diasSemana.has(hoyStr);
  const diasHechos = semana.filter((d) => diasSemana.has(d)).length;
  const fechaHoy = hoy.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="max-w-xl lg:max-w-5xl mx-auto grid lg:grid-cols-2 gap-4 lg:gap-6 items-start">
      <div className="space-y-4">
        <div>
          <p className="eyebrow">Hola, {nombre.split(" ")[0]}</p>
          <h1 className="font-display text-4xl uppercase leading-none mt-1 first-letter:uppercase">{fechaHoy}</h1>
        </div>

        {/* Hoy */}
        <section className="glass-panel p-4 space-y-3" aria-label="Hoy">
          {hechoHoy ? (
            <button
              type="button"
              onClick={() => onAbrirDia(hoy)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-primary/10 text-left"
            >
              <span className="w-11 h-11 rounded-full bg-primary text-white grid place-items-center shrink-0" aria-hidden="true">
                <Check size={24} strokeWidth={3} />
              </span>
              <span className="min-w-0">
                <b className="block font-heading text-base uppercase tracking-wide">Hoy ya entrenaste</b>
                <span className="text-sm text-textMuted">Tocá para ver o editar el registro.</span>
              </span>
            </button>
          ) : (
            <button type="button" className="btn-primary w-full min-h-[56px] text-lg" onClick={() => onRegistrar(hoy)}>
              <Plus size={24} aria-hidden="true" /> Registrar entreno
            </button>
          )}
          <p className="text-sm italic text-textMuted border-l-[3px] border-accent pl-3">"{frase}"</p>
        </section>

        {/* Semana */}
        <section className="glass-panel p-4 space-y-3" aria-labelledby="home-semana">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="home-semana" className="font-heading text-base uppercase tracking-wide">Esta semana</h2>
            <span className="font-mono text-xs text-textMuted">{diasHechos} de {meta} días</span>
          </div>
          <ol className="grid grid-cols-7 gap-1.5">
            {semana.map((d, i) => {
              const hecho = diasSemana.has(d);
              const esHoy = d === hoyStr;
              return (
                <li key={d} className={`flex flex-col items-center gap-1 font-mono text-xs ${esHoy ? "text-textMain font-bold" : "text-textMuted"}`}>
                  <span
                    className={`w-full max-w-[40px] aspect-square rounded-xl grid place-items-center
                      ${hecho ? "bg-primary text-white" : esHoy ? "border-2 border-primary" : "border-[1.5px] border-dashed border-borderBase"}`}
                    aria-label={`${DIAS[i]}: ${hecho ? "entrenaste" : "sin entreno"}`}
                  >
                    {hecho && <Check size={16} strokeWidth={3} aria-hidden="true" />}
                  </span>
                  {DIAS[i]}
                </li>
              );
            })}
          </ol>
          <div className="h-2 rounded-full bg-surfaceHighlight overflow-hidden" aria-hidden="true">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (diasHechos / meta) * 100)}%` }} />
          </div>
        </section>
      </div>

      <CalendarView
        mes={mesVisible}
        entrenos={entrenosMes}
        onMonthChange={(m) => { setMesVisible(m); cargarMes(m); }}
        onAbrirDia={onAbrirDia}
      />
    </div>
  );
}
