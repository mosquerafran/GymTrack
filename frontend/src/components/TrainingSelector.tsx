import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { User } from "firebase/auth";
import { Camera, ImagePlus, Loader, Plus, Save, X } from "lucide-react";
import { cargarCategoriasActivas } from "../services/categoriasService";
import { guardarAsistencia, actualizarAsistencia } from "../services/asistenciasService";
import { subirFotoEntrenamiento } from "../services/storageService";
import { chisteRandom } from "../config/constants";
import { Alerta } from "../config/alertas";
import { Musculo, TIPOS, TIPOS_ORDEN, TipoEntreno } from "../config/entrenos";
import { etiquetaDe, musculosDe, tipoDe, NombresCategoria } from "../utils/entrenos";
import { useSexo } from "../hooks/useSexo";
import { EjercicioRutina, Asistencia } from "../types";

// El cuerpo trae ~130 KB de paths SVG: se carga recién cuando se abre el registro.
const SelectorMusculos = lazy(() => import("./cuerpo/SelectorMusculos"));

interface TrainingSelectorProps {
  fecha: Date;
  user: User;
  grupoId: string;
  asistenciaAEditar?: Asistencia | null;
  onCompletado?: () => void;
  onCancelar?: () => void;
  /** Dentro de un panel (components/ui/Hoja): sin marco ni título, y Guardar fijo abajo. */
  enHoja?: boolean;
}

export default function TrainingSelector({ fecha, user, grupoId, asistenciaAEditar, onCompletado, onCancelar, enHoja = false }: TrainingSelectorProps): React.ReactElement {
  const sexo = useSexo(user.email);
  const editando = !!asistenciaAEditar;

  const [tipo, setTipo] = useState<TipoEntreno>("gym");
  const [musculos, setMusculos] = useState<Set<Musculo>>(new Set());
  const [etiqueta, setEtiqueta] = useState("");
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [notas, setNotas] = useState("");
  const [rutina, setRutina] = useState<EjercicioRutina[]>([]);

  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const inputCamara = useRef<HTMLInputElement>(null);
  const inputGaleria = useRef<HTMLInputElement>(null);

  // Precarga: las etiquetas del usuario (sus categorías de siempre) como sugerencias, y
  // si edita, los datos del entreno (los docs viejos se interpretan con utils/entrenos).
  useEffect(() => {
    let vivo = true;
    cargarCategoriasActivas(user.uid)
      .then((cats) => {
        if (!vivo) return;
        setSugerencias(cats.map((c) => c.nombre));
        if (asistenciaAEditar) {
          const nombres: NombresCategoria = Object.fromEntries(cats.map((c) => [c.id, c.nombre]));
          setTipo(tipoDe(asistenciaAEditar, nombres));
          setEtiqueta(etiquetaDe(asistenciaAEditar, nombres));
        }
      })
      .catch((err) => console.error("Error cargando etiquetas:", err));

    if (asistenciaAEditar) {
      setTipo(tipoDe(asistenciaAEditar));
      setMusculos(new Set(musculosDe(asistenciaAEditar)));
      setEtiqueta(etiquetaDe(asistenciaAEditar));
      setNotas(asistenciaAEditar.notas || "");
      setRutina(asistenciaAEditar.rutina || []);
      setFotoPreview(asistenciaAEditar.imagenUrl || null);
    }
    return () => { vivo = false; };
  }, [user.uid, asistenciaAEditar]);

  // Liberar la URL temporal de la foto elegida.
  useEffect(() => () => { if (fotoPreview?.startsWith("blob:")) URL.revokeObjectURL(fotoPreview); }, [fotoPreview]);

  const elegirFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFoto(file);
    setFotoPreview(URL.createObjectURL(file));
    e.target.value = ""; // permite volver a elegir la misma foto
  };

  const agregarEjercicio = () => setRutina([...rutina, { nombre: "" }]);
  const eliminarEjercicio = (i: number) => setRutina(rutina.filter((_, j) => j !== i));
  const actualizarEjercicio = (i: number, campo: keyof EjercicioRutina, valor: string | number | undefined) => {
    const nueva = [...rutina];
    nueva[i] = { ...nueva[i], [campo]: valor };
    setRutina(nueva);
  };

  const tieneFoto = !!(foto || asistenciaAEditar?.imagenUrl);
  const faltas: string[] = [];
  if (!tieneFoto) faltas.push("la foto");
  if (tipo === "gym" && musculos.size === 0) faltas.push("al menos un músculo");
  const listo = faltas.length === 0;

  const guardar = async () => {
    if (!listo || guardando) return;
    setGuardando(true);
    try {
      const imagenUrl = foto ? await subirFotoEntrenamiento(foto, user.uid) : asistenciaAEditar?.imagenUrl || null;
      const rutinaLimpia = rutina.filter((ej) => ej.nombre.trim() !== "");
      const musculosLista = tipo === "gym" ? Array.from(musculos) : [];

      if (asistenciaAEditar) {
        const id = (asistenciaAEditar.id || asistenciaAEditar.docId)!;
        await actualizarAsistencia(id, {
          tipo,
          musculos: musculosLista,
          etiqueta: etiqueta.trim(),
          notas: notas.trim(),
          rutina: rutinaLimpia,
          imagenUrl,
        });
        Alerta.fire({ titleText: "¡Listo!", text: "Cambios guardados.", icon: "success", timer: 1500, showConfirmButton: false });
      } else {
        await guardarAsistencia({
          userId: user.uid,
          userName: user.displayName || "Usuario",
          fecha,
          tipo,
          musculos: musculosLista,
          etiqueta,
          notas,
          rutina: rutinaLimpia,
          imagenUrl,
          grupoId: grupoId || "",
        });
        setNotas("");
        setFoto(null);
        setFotoPreview(null);
        setRutina([]);
        setMusculos(new Set());
        setEtiqueta("");
        Alerta.fire({ titleText: "¡Épico! 💪", text: chisteRandom(), icon: "success", confirmButtonText: "Seguir rompiéndola" });
      }
      onCompletado?.();
    } catch (err) {
      console.error("Error guardando entrenamiento:", err);
      Alerta.fire({ titleText: "No se pudo guardar", text: "Revisá la conexión y probá de nuevo.", icon: "error", confirmButtonText: "Entendido" });
    } finally {
      setGuardando(false);
    }
  };

  const fechaTexto = fecha.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className={enHoja ? "space-y-6" : "glass-panel p-4 sm:p-6 space-y-6"}>
      {!enHoja && (
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-heading text-xl uppercase tracking-wide text-textMain">
            {editando ? "Editar entreno" : "Registrar entreno"}
          </h2>
          <p className="text-sm text-textMuted first-letter:uppercase">{fechaTexto}</p>
        </div>
        {editando && (
          <button type="button" onClick={onCancelar} className="btn-icon text-textMuted shrink-0" aria-label="Cancelar edición">
            <X size={22} />
          </button>
        )}
      </div>
      )}

      {/* Foto: cámara o galería (sin foto no hay gains) */}
      <section aria-labelledby="ts-foto">
        <div className="flex justify-between items-baseline mb-2">
          <span id="ts-foto" className="eyebrow">Foto</span>
          <span className="font-mono text-xs text-textMuted">obligatoria</span>
        </div>
        {fotoPreview ? (
          <div className="relative rounded-2xl overflow-hidden bg-surfaceHighlight aspect-[4/3]">
            <img src={fotoPreview} alt="Foto elegida para el entreno" className="absolute inset-0 w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => inputGaleria.current?.click()}
              className="absolute right-2.5 bottom-2.5 min-h-tap px-4 rounded-xl bg-surface text-textMain font-semibold text-sm shadow-premium"
            >
              Cambiar foto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => inputCamara.current?.click()} className="min-h-[88px] rounded-2xl border-2 border-dashed border-borderBase bg-background flex flex-col items-center justify-center gap-1.5 text-sm font-semibold active:scale-[0.98] transition-transform">
              <Camera size={26} className="text-primary" /> Sacar foto
            </button>
            <button type="button" onClick={() => inputGaleria.current?.click()} className="min-h-[88px] rounded-2xl border-2 border-dashed border-borderBase bg-background flex flex-col items-center justify-center gap-1.5 text-sm font-semibold active:scale-[0.98] transition-transform">
              <ImagePlus size={26} className="text-primary" /> Elegir de galería
            </button>
          </div>
        )}
        <input ref={inputCamara} type="file" accept="image/*" capture="environment" className="hidden" onChange={elegirFoto} />
        <input ref={inputGaleria} type="file" accept="image/*" className="hidden" onChange={elegirFoto} />
      </section>

      {/* Tipo */}
      <section aria-labelledby="ts-tipo">
        <span id="ts-tipo" className="eyebrow block mb-2">Tipo de entreno</span>
        <div className="grid grid-cols-4 gap-2" role="group" aria-labelledby="ts-tipo">
          {TIPOS_ORDEN.map((t) => {
            const activo = t === tipo;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={activo}
                onClick={() => setTipo(t)}
                className={`min-h-[64px] rounded-2xl border-[1.5px] flex flex-col items-center justify-center gap-0.5 font-heading text-[13px] uppercase tracking-wide transition-colors ${activo ? "border-primary bg-primary/10 text-primary" : "border-borderBase bg-background text-textMain"}`}
              >
                <span className="text-xl leading-none" aria-hidden="true">{TIPOS[t].emoji}</span>
                {TIPOS[t].nombre}
              </button>
            );
          })}
        </div>
      </section>

      {/* Músculos (gym) o aclaración (el resto) */}
      {tipo === "gym" ? (
        <Suspense fallback={<div className="h-[360px] rounded-2xl bg-background animate-pulse" aria-label="Cargando el cuerpo" />}>
          <SelectorMusculos
            sexo={sexo}
            seleccion={musculos}
            onChange={setMusculos}
            onAtajo={(nombre) => setEtiqueta((e) => e || nombre)}
          />
        </Suspense>
      ) : (
        <p className="rounded-2xl border border-dashed border-borderBase bg-background p-4 text-sm text-textMuted">
          <strong className="text-textMain">{TIPOS[tipo].emoji} {TIPOS[tipo].nombre}.</strong> Suma al ranking igual que el gym. Usá la etiqueta para contar qué fue.
        </p>
      )}

      {/* Etiqueta libre con sugerencias */}
      <section>
        <div className="flex justify-between items-baseline mb-2">
          <label htmlFor="ts-etiqueta" className="eyebrow">Etiqueta</label>
          <span className="font-mono text-xs text-textMuted">opcional</span>
        </div>
        <input
          id="ts-etiqueta"
          type="text"
          maxLength={60}
          placeholder="Ej: Push pesado, Minubi 🥵"
          className="input-field"
          value={etiqueta}
          onChange={(e) => setEtiqueta(e.target.value)}
        />
        {sugerencias.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {sugerencias.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setEtiqueta(s)}
                className={`min-h-[40px] px-3.5 rounded-full border text-sm font-semibold ${etiqueta === s ? "border-primary text-primary bg-primary/10" : "border-borderBase bg-background text-textMain"}`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* PRs */}
      <section>
        <div className="flex justify-between items-baseline mb-2">
          <span className="eyebrow">PRs del día</span>
          <span className="font-mono text-xs text-textMuted">opcional</span>
        </div>
        <div className="space-y-2">
          {rutina.map((ej, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_72px_64px_44px] gap-1.5 items-center">
              <input
                type="text"
                aria-label={`Ejercicio del PR ${i + 1}`}
                placeholder="Ejercicio"
                className="input-field !px-3"
                value={ej.nombre}
                onChange={(e) => actualizarEjercicio(i, "nombre", e.target.value)}
              />
              <input
                type="number"
                inputMode="decimal"
                aria-label={`Kilos del PR ${i + 1}`}
                placeholder="Kg"
                className="input-field !px-2 text-center"
                value={ej.peso || ""}
                onChange={(e) => actualizarEjercicio(i, "peso", e.target.value ? Number(e.target.value) : undefined)}
              />
              <input
                type="number"
                inputMode="numeric"
                aria-label={`Repeticiones del PR ${i + 1}`}
                placeholder="Reps"
                className="input-field !px-2 text-center"
                value={ej.reps || ""}
                onChange={(e) => actualizarEjercicio(i, "reps", e.target.value ? Number(e.target.value) : undefined)}
              />
              <button type="button" onClick={() => eliminarEjercicio(i)} className="btn-icon text-red-500" aria-label={`Quitar PR ${i + 1}`}>
                <X size={20} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={agregarEjercicio}
          className="mt-2 w-full min-h-[48px] rounded-xl border-[1.5px] border-dashed border-borderBase text-primary font-semibold flex items-center justify-center gap-1.5"
        >
          <Plus size={18} /> Agregar PR
        </button>
      </section>

      {/* Mensaje */}
      <section>
        <div className="flex justify-between items-baseline mb-2">
          <label htmlFor="ts-notas" className="eyebrow">Mensaje del día</label>
          <span className="font-mono text-xs text-textMuted">opcional</span>
        </div>
        <textarea
          id="ts-notas"
          maxLength={1000}
          rows={3}
          placeholder="¿Cómo te fue?"
          className="input-field resize-y"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
      </section>

      <div className={enHoja ? "sticky bottom-0 -mx-4 -mb-4 px-4 pt-3 pb-safe-3 bg-surface border-t border-borderBase space-y-1.5" : "space-y-1.5"}>
        <button type="button" className="btn-primary w-full min-h-[52px] text-lg disabled:opacity-40 disabled:pointer-events-none" onClick={guardar} disabled={!listo || guardando}>
          {guardando ? <Loader className="animate-spin" size={20} /> : editando ? <Save size={20} /> : <Plus size={22} />}
          {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Guardar entreno"}
        </button>
        <p className="text-center text-sm text-textMuted" aria-live="polite">
          {listo ? "Todo listo." : `Falta ${faltas.join(" y ")}.`}
        </p>
      </div>
    </div>
  );
}
