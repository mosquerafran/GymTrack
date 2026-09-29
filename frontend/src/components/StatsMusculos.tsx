import React, { useState } from "react";
import { ChevronDown, Crown } from "lucide-react";
import Cuerpo from "./cuerpo/Cuerpo";
import { MUSCULOS, Musculo, NOMBRE_MUSCULO, Sexo } from "../config/entrenos";
import { nivelDeCalor } from "../utils/entrenos";
import { diasTranscurridos, parseFechaLocal } from "../utils/date";

interface StatsMusculosProps {
  sexo: Sexo;
  /** Días por músculo en el período. */
  porMusculo: Partial<Record<Musculo, number>>;
  umbral: [number, number, number];
  /** Última fecha de cada músculo (todo el historial). */
  ultimaVez: Partial<Record<Musculo, string>>;
  tren: { superior: number; inferior: number };
  lideres: { zona: string; nombre: string; dias: number }[];
  /** "septiembre", "esta semana"... */
  rangoTexto: string;
  miNombre?: string;
}

const OLVIDADO_DESDE_DIAS = 14;

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

const Titulo = ({ id, texto, detalle }: { id: string; texto: string; detalle: string }) => (
  <div className="flex items-baseline justify-between gap-2">
    <h2 id={id} className="font-heading text-base uppercase tracking-wide text-textMain">{texto}</h2>
    <span className="font-mono text-xs text-textMuted">{detalle}</span>
  </div>
);

/**
 * Stats por músculo: mapa de calor, días por músculo, olvidados, arriba vs. abajo y
 * reyes de cada zona. Magnitud = un solo color (óxido) en intensidades; el número va
 * siempre escrito al lado (nada depende solo del color).
 */
export default function StatsMusculos({ sexo, porMusculo, umbral, ultimaVez, tren, lideres, rangoTexto, miNombre }: StatsMusculosProps): React.ReactElement {
  const [resaltado, setResaltado] = useState<Musculo | null>(null);
  const [verTodos, setVerTodos] = useState(false);

  const hoy = new Date();
  const diasDesde = (m: Musculo): number | null => {
    const f = ultimaVez[m];
    return f ? diasTranscurridos(parseFechaLocal(f), hoy) - 1 : null;
  };

  const niveles: Partial<Record<Musculo, number>> = {};
  for (const m of MUSCULOS) niveles[m.id] = nivelDeCalor(porMusculo[m.id] || 0, umbral);

  const describir = (m: Musculo) => `${NOMBRE_MUSCULO[m]}: ${plural(porMusculo[m] || 0, "día", "días")}`;

  const orden = MUSCULOS.map((m) => ({ id: m.id, dias: porMusculo[m.id] || 0 })).sort((a, b) => b.dias - a.dias);
  const max = Math.max(1, ...orden.map((o) => o.dias));
  const visibles = verTodos ? orden : orden.slice(0, 6);

  const tieneHistorial = Object.keys(ultimaVez).length > 0;
  const olvidados = MUSCULOS.map((m) => ({ id: m.id, hace: diasDesde(m.id) }))
    .filter((o) => o.hace === null || o.hace >= OLVIDADO_DESDE_DIAS)
    .sort((a, b) => (b.hace ?? Infinity) - (a.hace ?? Infinity));
  const piernasOlvidadas = olvidados.some((o) => o.id === "cuadriceps" || o.id === "isquios");

  const maxTren = Math.max(1, tren.superior, tren.inferior);
  const ratio = tren.inferior ? (tren.superior / tren.inferior).toFixed(1).replace(".", ",") : null;

  const detalle = resaltado
    ? (() => {
        const hace = diasDesde(resaltado);
        return (
          <>
            <b className="font-heading text-base tracking-wide">{NOMBRE_MUSCULO[resaltado]}</b>
            <span>
              {plural(porMusculo[resaltado] || 0, "día", "días")}
              {hace === null ? " · todavía sin registrar" : hace === 0 ? " · última vez hoy" : ` · última vez hace ${plural(hace, "día", "días")}`}
            </span>
          </>
        );
      })()
    : "Tocá un músculo para ver cuántos días lo trabajaste.";

  const tarjeta = "glass-panel p-4 sm:p-6 space-y-3";

  return (
    <>
      {/* Tu cuerpo: mapa de calor */}
      <section className={tarjeta} aria-labelledby="sm-cuerpo">
        <Titulo id="sm-cuerpo" texto="Tu cuerpo" detalle={rangoTexto} />
        <div className="grid grid-cols-2 gap-1 bg-background rounded-2xl px-1 pt-2.5 pb-1.5">
          {(["front", "back"] as const).map((lado) => (
            <div key={lado} className="flex flex-col items-center gap-0.5 min-w-0">
              <Cuerpo
                sexo={sexo}
                lado={lado}
                intensidad={niveles}
                resaltado={resaltado}
                describir={describir}
                onToggle={(m) => setResaltado((r) => (r === m ? null : m))}
                etiqueta={lado === "front" ? "Mapa de calor, frente: tocá un músculo para ver el detalle" : "Mapa de calor, espalda: tocá un músculo para ver el detalle"}
                className="max-w-[160px]"
              />
              <span className="font-mono text-xs tracking-[0.14em] uppercase text-textMuted">{lado === "front" ? "Frente" : "Espalda"}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-textMuted">
          <span>Días:</span>
          <i className="inline-block w-[22px] h-2.5 rounded-sm" style={{ background: "rgb(var(--color-musculo))" }} />0
          <i className="inline-block w-[22px] h-2.5 rounded-sm bg-primary/[0.35]" />{umbral[0]}{umbral[1] - 1 > umbral[0] ? `–${umbral[1] - 1}` : ""}
          <i className="inline-block w-[22px] h-2.5 rounded-sm bg-primary/[0.65]" />{umbral[1]}{umbral[2] - 1 > umbral[1] ? `–${umbral[2] - 1}` : ""}
          <i className="inline-block w-[22px] h-2.5 rounded-sm bg-primary" />{umbral[2]}+
        </div>
        <div className="min-h-tap flex flex-wrap items-center gap-x-2.5 gap-y-0.5 px-3 py-2 rounded-xl bg-background text-sm text-textMain" aria-live="polite">
          {detalle}
        </div>
      </section>

      {/* Días por músculo */}
      <section className={tarjeta} aria-labelledby="sm-barras">
        <Titulo id="sm-barras" texto="Días por músculo" detalle="de más a menos" />
        <ul className="space-y-2">
          {visibles.map((o) => (
            <li key={o.id} className="grid grid-cols-[104px_minmax(0,1fr)_28px] items-center gap-2 min-h-[28px] text-sm">
              <span className={`truncate ${o.dias ? "text-textMain" : "text-textMuted"}`}>{NOMBRE_MUSCULO[o.id]}</span>
              <span className="h-3 rounded bg-surfaceHighlight overflow-hidden" aria-hidden="true">
                <span className="block h-full bg-primary rounded-r" style={{ width: `${(o.dias / max) * 100}%` }} />
              </span>
              <span className={`text-right scoreboard font-bold ${o.dias ? "text-textMain" : "text-textMuted"}`}>{o.dias}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setVerTodos((v) => !v)}
          aria-expanded={verTodos}
          className="min-h-tap flex items-center gap-1 text-sm font-semibold text-textMuted"
        >
          {verTodos ? "Ver solo los 6 primeros" : `Ver los ${MUSCULOS.length} músculos`}
          <ChevronDown size={18} className={`transition-transform ${verTodos ? "rotate-180" : ""}`} />
        </button>
      </section>

      {/* Olvidados */}
      {tieneHistorial && olvidados.length > 0 && (
        <section className={tarjeta} aria-labelledby="sm-olvidados">
          <Titulo id="sm-olvidados" texto="Músculos olvidados" detalle={`${OLVIDADO_DESDE_DIAS} días o más`} />
          <ul className="flex flex-wrap gap-2">
            {olvidados.map((o) => (
              <li key={o.id} className="inline-flex items-baseline gap-1.5 border-[1.5px] border-dashed border-primary rounded-full px-3 py-1.5 text-sm font-semibold">
                {NOMBRE_MUSCULO[o.id]}
                <span className="font-mono text-xs text-textMuted font-normal">{o.hace === null ? "nunca" : plural(o.hace, "día", "días")}</span>
              </li>
            ))}
          </ul>
          {piernasOlvidadas && (
            <p className="border-l-[3px] border-primary pl-3 text-sm">
              <b className="font-heading tracking-wide">¿Y las piernas?</b> Piernas se entrena aunque juegues al fútbol.
            </p>
          )}
        </section>
      )}

      {/* Arriba vs. abajo */}
      <section className={tarjeta} aria-labelledby="sm-tren">
        <Titulo id="sm-tren" texto="Arriba vs. abajo" detalle="días en el período" />
        {[{ n: "Tren superior", v: tren.superior }, { n: "Tren inferior", v: tren.inferior }].map((t) => (
          <div key={t.n} className="grid grid-cols-[110px_minmax(0,1fr)_56px] items-center gap-2 text-sm">
            <span>{t.n}</span>
            <span className="h-4 rounded bg-surfaceHighlight overflow-hidden" aria-hidden="true">
              <span className="block h-full bg-primary rounded-r" style={{ width: `${(t.v / maxTren) * 100}%` }} />
            </span>
            <span className="text-right scoreboard font-bold">{t.v} d</span>
          </div>
        ))}
        <p className="text-sm text-textMuted">
          {tren.superior + tren.inferior === 0
            ? "Sin entrenos con músculos en el período."
            : ratio === null
              ? "Nada de tren inferior en el período."
              : `Entrenás arriba ${ratio} veces lo que abajo.`}
        </p>
      </section>

      {/* Reyes de cada zona */}
      {lideres.length > 0 && (
        <section className={tarjeta} aria-labelledby="sm-reyes">
          <Titulo id="sm-reyes" texto="Reyes de cada músculo" detalle="quién más lo entrenó" />
          <ul className="grid grid-cols-2 gap-2">
            {lideres.map((l) => {
              const soyYo = !!miNombre && l.nombre === miNombre;
              return (
                <li key={l.zona} className="bg-background border border-borderBase rounded-2xl px-3 py-2.5 min-w-0">
                  <span className="flex items-center gap-1 font-mono text-xs uppercase tracking-wide text-textMuted">
                    <Crown size={12} className="text-accent" aria-hidden="true" /> {l.zona}
                  </span>
                  <b className={`block font-heading text-base tracking-wide truncate ${soyYo ? "text-primary" : "text-textMain"}`}>
                    {l.nombre}{soyYo && " (vos)"}
                  </b>
                  <span className="text-sm text-textMuted">{plural(l.dias, "día", "días")}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
