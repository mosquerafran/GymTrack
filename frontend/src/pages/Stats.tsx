import React, { lazy, Suspense, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { calcularStats, StatsData, PeriodoStats } from "../services/statsService";
import { obtenerMetaSemanal } from "../services/usuarioService";
import { META_SEMANAL_DEFAULT } from "../types";
import { Crown, Trophy, Target, RotateCw } from "lucide-react";
import YearHeatmap from "../components/YearHeatmap";
import Podio from "../components/Podio";
import { TIPOS } from "../config/entrenos";
import { useSexo } from "../hooks/useSexo";

// Las secciones por músculo dibujan el cuerpo (~130 KB de paths): se cargan aparte.
const StatsMusculos = lazy(() => import("../components/StatsMusculos"));

interface StatsProps {
  user: User;
  grupoId: string;
}

const PERIODOS: { id: PeriodoStats; label: string }[] = [
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mes" },
  { id: "anio", label: "Año" },
];

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const rangoTexto = (periodo: PeriodoStats): string => {
  const hoy = new Date();
  if (periodo === "semana") return "esta semana";
  if (periodo === "mes") return MESES[hoy.getMonth()];
  return String(hoy.getFullYear());
};

export default function Stats({ user, grupoId }: StatsProps): React.ReactElement {
  const [data, setData] = useState<StatsData | null>(null);
  const [periodo, setPeriodo] = useState<PeriodoStats>("mes");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [metaSemanal, setMetaSemanal] = useState<number>(META_SEMANAL_DEFAULT);
  const sexo = useSexo(user.email);

  const anioActual = new Date().getFullYear();
  const miNombre = user.displayName || undefined;

  useEffect(() => {
    if (user) cargar(periodo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, periodo]);

  useEffect(() => {
    if (user?.email) obtenerMetaSemanal(user.email).then(setMetaSemanal).catch(() => {});
  }, [user]);

  const cargar = async (tipoPeriodo: PeriodoStats) => {
    setLoading(true);
    setError(false);
    try {
      setData(await calcularStats(user.uid, grupoId, tipoPeriodo));
    } catch (e) {
      console.error("Error cargando stats:", e);
      setError(true);
    }
    setLoading(false);
  };

  const selector = (
    <div className="grid grid-cols-3 gap-1 bg-surfaceHighlight p-1 rounded-2xl" role="group" aria-label="Período">
      {PERIODOS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          aria-pressed={periodo === opt.id}
          onClick={() => setPeriodo(opt.id)}
          className={`min-h-tap rounded-xl font-heading text-sm uppercase tracking-wide transition-colors ${periodo === opt.id ? "bg-surface text-primary shadow-sm" : "text-textMuted"}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  const encabezado = (
    <div>
      <p className="eyebrow !text-xs">Constancia · músculos · ranking</p>
      <h1 className="font-display text-4xl sm:text-5xl text-textMain leading-none uppercase mt-1">Tu progreso</h1>
    </div>
  );

  if (error) return (
    <div className="max-w-xl mx-auto space-y-4 animate-fade-in">
      {encabezado}
      {selector}
      <div className="glass-panel p-6 text-center space-y-3">
        <p className="font-heading text-lg uppercase tracking-wide">No se pudieron cargar tus stats</p>
        <p className="text-sm text-textMuted">Revisá la conexión y probá de nuevo.</p>
        <button type="button" className="btn-primary mx-auto" onClick={() => cargar(periodo)}>
          <RotateCw size={18} /> Reintentar
        </button>
      </div>
    </div>
  );

  if (loading || !data) return (
    <div className="max-w-xl mx-auto space-y-4 animate-fade-in">
      {encabezado}
      {selector}
      <div className="flex flex-col items-center justify-center py-24 gap-3" aria-live="polite">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-textMuted text-sm">Calculando…</p>
      </div>
    </div>
  );

  const semanaCompleta = data.diasEstaSemana >= metaSemanal;
  const deltaSemana = data.diasEstaSemana - data.diasSemanaPasada;
  const deltaColor = deltaSemana > 0 ? "text-green-600 dark:text-green-400" : deltaSemana < 0 ? "text-red-600 dark:text-red-400" : "text-textMuted";
  const deltaTexto = deltaSemana > 0 ? `↑${deltaSemana}` : deltaSemana < 0 ? `↓${Math.abs(deltaSemana)}` : "=";

  let recordNudge: string | null = null;
  if (data.rachaActual > 0) {
    if (data.rachaActual >= data.rachaRecord) {
      recordNudge = `🔥 ¡Estás en tu mejor racha histórica (${data.rachaActual} días)! No la cortes.`;
    } else if (data.rachaRecord - data.rachaActual <= 3) {
      recordNudge = `A ${data.rachaRecord - data.rachaActual} día(s) de igualar tu récord de ${data.rachaRecord}. 💪`;
    }
  }

  const tarjeta = "glass-panel p-4 sm:p-6 space-y-3";
  const titulo = (id: string, texto: string, detalle?: string) => (
    <div className="flex items-baseline justify-between gap-2">
      <h2 id={id} className="font-heading text-base uppercase tracking-wide text-textMain">{texto}</h2>
      {detalle && <span className="font-mono text-xs text-textMuted">{detalle}</span>}
    </div>
  );

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-fade-in">
      {encabezado}
      {selector}

      {/* Constancia, rachas y semana */}
      <section className={tarjeta} aria-label="Constancia">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="flex items-baseline">
              <span className="font-display text-7xl text-primary leading-none tabular-nums">{data.porcentaje}</span>
              <span className="font-display text-3xl text-primary/60">%</span>
            </div>
            <p className="eyebrow !text-xs mt-1.5">Constancia</p>
          </div>
          <div className="text-right text-sm text-textMuted">
            <p className="scoreboard text-2xl font-bold text-textMain leading-none">
              {data.totalDiasEntrenados}<span className="text-textMuted text-lg">/{data.diasPosibles}</span>
            </p>
            días entrenados<br />{rangoTexto(periodo)}
          </div>
        </div>
        <div className="h-2.5 w-full bg-surfaceHighlight rounded-full overflow-hidden" aria-hidden="true">
          <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${data.porcentaje}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-background border border-borderBase rounded-2xl p-3 text-center">
            <p className="scoreboard text-2xl font-bold leading-none">{data.rachaActual}</p>
            <p className="font-mono text-xs uppercase tracking-wide text-textMuted mt-1.5">Racha</p>
          </div>
          <div className="bg-background border border-borderBase rounded-2xl p-3 text-center">
            <p className="scoreboard text-2xl font-bold leading-none">{data.rachaRecord}</p>
            <p className="font-mono text-xs uppercase tracking-wide text-textMuted mt-1.5">Récord</p>
          </div>
          <div className={`rounded-2xl p-3 text-center border ${semanaCompleta ? "bg-primary/10 border-primary/30" : "bg-background border-borderBase"}`}>
            <p className="scoreboard text-2xl font-bold leading-none">
              {data.diasEstaSemana}<span className="text-textMuted text-base">/{metaSemanal}</span>
            </p>
            <p className="font-mono text-xs uppercase tracking-wide text-textMuted mt-1.5">Semana</p>
            <p className={`text-xs font-bold mt-0.5 ${deltaColor}`}>
              {deltaTexto} <span className="text-textMuted font-normal">vs. anterior</span>
            </p>
          </div>
        </div>
        {recordNudge && (
          <p className="flex items-center gap-2 text-sm font-semibold bg-accent/10 border border-accent/20 rounded-xl px-3 py-2">
            <Trophy size={16} className="text-accent shrink-0" /> {recordNudge}
          </p>
        )}
        <p className="flex items-center gap-2 text-sm text-textMuted">
          <Target size={16} className="text-primary shrink-0" />
          {semanaCompleta
            ? `¡Meta de la semana cumplida! (${metaSemanal} días) 💪`
            : `Te faltan ${metaSemanal - data.diasEstaSemana} día(s) para tu meta semanal.`}
        </p>
      </section>

      {/* Por músculo */}
      <Suspense fallback={<div className="glass-panel h-[420px] animate-pulse" aria-label="Cargando el cuerpo" />}>
        <StatsMusculos
          sexo={sexo}
          porMusculo={data.musculosPeriodo}
          umbral={data.umbralCalor}
          ultimaVez={data.ultimaVezMusculo}
          tren={data.tren}
          lideres={data.lideres}
          rangoTexto={rangoTexto(periodo)}
          miNombre={miNombre}
        />
      </Suspense>

      {/* Ranking */}
      <section className={tarjeta} aria-labelledby="st-ranking">
        {titulo("st-ranking", "Ranking del grupo", rangoTexto(periodo))}
        <Podio ranking={data.ranking} miNombre={miNombre} />
        <ol>
          {data.ranking.map((usr, idx) => {
            const soyYo = usr.nombre === miNombre;
            return (
              <li key={usr.nombre} className="py-3 border-t border-borderBase first:border-t-0 space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center scoreboard text-sm font-bold shrink-0 ${idx === 0 ? "bg-primary text-white" : "bg-surfaceHighlight text-textMain"}`}>
                    {idx === 0 ? <Crown size={14} aria-label="Primero" /> : idx + 1}
                  </span>
                  <span className={`flex-1 min-w-0 truncate font-bold ${soyYo ? "text-primary" : "text-textMain"}`}>
                    {usr.nombre}{soyYo && " (vos)"}
                  </span>
                  <span className="scoreboard text-xl font-bold shrink-0">
                    {usr.dias} <span className="font-sans text-sm font-normal text-textMuted">días · {usr.porcentaje}%</span>
                  </span>
                </div>
                <div className="h-1.5 w-full bg-surfaceHighlight rounded-full overflow-hidden" aria-hidden="true">
                  <div className={`h-full rounded-full ${idx === 0 ? "bg-primary" : "bg-textMuted/50"}`} style={{ width: `${usr.porcentaje}%` }} />
                </div>
                <p className="text-sm text-textMuted">
                  {usr.porTipo.map(({ tipo, cantidad }) => `${TIPOS[tipo].nombre} ${cantidad}`).join(" · ")}
                </p>
              </li>
            );
          })}
        </ol>
        {data.ranking.length === 0 && <p className="text-sm text-textMuted py-4 text-center">Nadie entrenó en el período.</p>}
        <p className="text-sm text-textMuted">Todo entreno suma: gym, fútbol, running u otro. Un día cuenta una sola vez.</p>
      </section>

      {/* Tus entrenos por tipo */}
      <section className={tarjeta} aria-labelledby="st-tipos">
        {titulo("st-tipos", "Tus entrenos por tipo", rangoTexto(periodo))}
        {data.conteoPorTipo.length === 0 ? (
          <p className="text-sm text-textMuted">Sin entrenos en el período.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {data.conteoPorTipo.map(({ tipo, cantidad }) => (
              <li key={tipo} className="flex items-center justify-between px-3 py-2.5 rounded-2xl bg-background border border-borderBase">
                <span className="font-semibold"><span aria-hidden="true">{TIPOS[tipo].emoji} </span>{TIPOS[tipo].nombre}</span>
                <span className="scoreboard text-lg font-bold text-primary">{cantidad}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Tu año */}
      <section className={tarjeta}>
        <YearHeatmap dias={data.diasEntrenadosAnio} anio={anioActual} />
      </section>

      <p className="text-center text-sm text-textMuted leading-relaxed px-2">
        La constancia es el % de días que entrenaste sobre los días transcurridos del período.
        En los entrenos anteriores al registro por músculo, los músculos se deducen del nombre de la categoría.
      </p>
    </div>
  );
}
