import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import Cuerpo from "./Cuerpo";
import { ATAJOS, MUSCULOS, Musculo, NOMBRE_MUSCULO, Sexo } from "../../config/entrenos";

interface SelectorMusculosProps {
  sexo: Sexo;
  seleccion: ReadonlySet<Musculo>;
  onChange: (nueva: Set<Musculo>) => void;
  /** Al tocar un atajo (Push, Pull...) se avisa, para sugerirlo como etiqueta. */
  onAtajo?: (nombre: string) => void;
}

/**
 * Selección de músculos para un entreno de gym: cuerpo de frente y espalda tocable,
 * atajos, y la misma selección como lista de checkboxes (plegada por defecto).
 * Se carga con React.lazy: trae los paths del cuerpo (~130 KB) solo cuando hace falta.
 */
export default function SelectorMusculos({ sexo, seleccion, onChange, onAtajo }: SelectorMusculosProps): React.ReactElement {
  const [listaAbierta, setListaAbierta] = useState(false);

  const toggle = (m: Musculo) => {
    const nueva = new Set(seleccion);
    nueva.has(m) ? nueva.delete(m) : nueva.add(m);
    onChange(nueva);
  };

  const aplicarAtajo = (nombre: string, musculos: Musculo[]) => {
    onChange(new Set([...seleccion, ...musculos]));
    onAtajo?.(nombre);
  };

  const nombres = MUSCULOS.filter((m) => seleccion.has(m.id)).map((m) => NOMBRE_MUSCULO[m.id]);
  const n = seleccion.size;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-baseline">
        <span className="eyebrow">Músculos</span>
        <span className="font-mono text-xs text-textMuted">{n === 1 ? "1 elegido" : `${n} elegidos`}</span>
      </div>

      <div className="grid grid-cols-2 gap-1 bg-background rounded-2xl px-1 pt-2.5 pb-1.5">
        {(["front", "back"] as const).map((lado) => (
          <div key={lado} className="flex flex-col items-center gap-0.5 min-w-0">
            <Cuerpo
              sexo={sexo}
              lado={lado}
              seleccion={seleccion}
              onToggle={toggle}
              etiqueta={lado === "front" ? "Cuerpo de frente: tocá un músculo para marcarlo" : "Cuerpo de espalda: tocá un músculo para marcarlo"}
              className="max-w-[160px]"
            />
            <span className="font-mono text-xs tracking-[0.14em] uppercase text-textMuted">
              {lado === "front" ? "Frente" : "Espalda"}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Atajos">
        {ATAJOS.map((a) => (
          <button
            key={a.nombre}
            type="button"
            onClick={() => aplicarAtajo(a.nombre, a.musculos)}
            className="min-h-[40px] px-3.5 rounded-full border border-borderBase bg-background text-sm font-semibold active:scale-95 transition-transform"
          >
            {a.nombre}
          </button>
        ))}
        {n > 0 && (
          <button
            type="button"
            onClick={() => onChange(new Set())}
            className="min-h-[40px] px-3.5 rounded-full border border-borderBase text-sm font-semibold text-textMuted"
          >
            Limpiar
          </button>
        )}
      </div>

      <p className={`min-h-[1.5em] ${nombres.length ? "font-heading text-base tracking-wide" : "text-sm text-textMuted"}`} aria-live="polite">
        {nombres.length ? nombres.join(" · ") : "Tocá el cuerpo o usá un atajo."}
      </p>

      <button
        type="button"
        onClick={() => setListaAbierta((v) => !v)}
        aria-expanded={listaAbierta}
        className="w-full min-h-tap flex items-center justify-between text-sm font-semibold text-textMuted"
      >
        {listaAbierta ? "Ocultar lista de músculos" : "Ver lista de músculos"}
        <ChevronDown size={18} className={`transition-transform ${listaAbierta ? "rotate-180" : ""}`} />
      </button>

      {listaAbierta && (
        <div className="grid grid-cols-2 gap-1.5">
          {MUSCULOS.map((m) => {
            const on = seleccion.has(m.id);
            return (
              <label
                key={m.id}
                className={`flex items-center gap-2.5 min-h-tap px-2.5 rounded-xl border cursor-pointer text-sm ${on ? "border-primary bg-primary/10" : "border-borderBase bg-background"}`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(m.id)}
                  className="w-[18px] h-[18px] accent-primary shrink-0"
                />
                {m.nombre}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
