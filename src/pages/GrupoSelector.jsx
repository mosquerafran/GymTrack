import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { Users, Plus, KeyRound, LogOut, Sun, Moon, Copy, Check, ShieldCheck } from "lucide-react";
import Swal from "sweetalert2";

const ADMIN_EMAIL = "mosquerafran265@gmail.com";
const MIEMBROS_MILLER = [
  "mosquerafran265@gmail.com",
  "rravenna59@gmail.com",
  "pedrozaffino@gmail.com",
  "jgonzalezgalceran@gmail.com"
];

export default function GrupoSelector({ user, onSelectGrupo, theme, toggleTheme }) {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState("lista"); // lista | crear | unirse
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [codigoInput, setCodigoInput] = useState("");

  useEffect(() => {
    cargarGrupos();
  }, [user]);

  const generarCodigo = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "GYM-";
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  };

  const cargarGrupos = async () => {
    setLoading(true);
    try {
      // Solo el Admin Maestro puede verificar/migrar todos los grupos
      if (user.email === ADMIN_EMAIL) {
        const allGruposSnap = await getDocs(collection(db, "grupos"));
        
        if (allGruposSnap.empty) {
          await migrarDatos();
          return cargarGrupos();
        }

        // Verificar miembros del grupo Miller si existe
        const millerDoc = allGruposSnap.docs.find(d => d.data().nombre === "Gym ave Miller 2026");
        if (millerDoc) {
          const currentMiembros = millerDoc.data().miembros || [];
          const missing = MIEMBROS_MILLER.filter(m => !currentMiembros.includes(m));
          if (missing.length > 0) {
            console.log("🛠️ Reparando miembros de Gym ave Miller 2026...");
            await updateDoc(doc(db, "grupos", millerDoc.id), {
              miembros: [...new Set([...currentMiembros, ...MIEMBROS_MILLER])]
            });
          }
        }
      }

      // Cargar grupos donde el usuario es miembro
      const q = query(collection(db, "grupos"), where("miembros", "array-contains", user.email));
      const snap = await getDocs(q);
      setGrupos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Error cargando grupos:", e);
    }
    setLoading(false);
  };

  const migrarDatos = async () => {
    console.log("🔄 Migrando datos al grupo por defecto...");
    
    // Crear grupo por defecto
    const grupoRef = await addDoc(collection(db, "grupos"), {
      nombre: "Gym ave Miller 2026",
      adminEmail: ADMIN_EMAIL,
      miembros: MIEMBROS_MILLER,
      codigoInvitacion: generarCodigo(),
      creadoEn: new Date().toISOString()
    });

    // Migrar todas las asistencias existentes
    const snapAsis = await getDocs(collection(db, "asistencias"));
    const batch = [];
    snapAsis.forEach(document => {
      if (!document.data().grupoId) {
        batch.push(updateDoc(doc(db, "asistencias", document.id), { grupoId: grupoRef.id }));
      }
    });
    await Promise.all(batch);

    console.log(`✅ Migración completa: ${batch.length} entrenos asignados a "Gym ave Miller 2026"`);
  };

  const crearGrupo = async (e) => {
    e.preventDefault();
    if (!nombreNuevo.trim()) return;

    try {
      const ref = await addDoc(collection(db, "grupos"), {
        nombre: nombreNuevo.trim(),
        adminEmail: user.email,
        miembros: [user.email],
        codigoInvitacion: generarCodigo(),
        creadoEn: new Date().toISOString()
      });

      Swal.fire({
        title: "¡Grupo Creado! 🎉",
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        background: 'var(--color-surface)',
        color: 'var(--color-text-main)'
      });

      setNombreNuevo("");
      setModo("lista");
      cargarGrupos();
    } catch (e) {
      console.error(e);
    }
  };

  const unirseConCodigo = async (e) => {
    e.preventDefault();
    if (!codigoInput.trim()) return;

    try {
      const q = query(collection(db, "grupos"), where("codigoInvitacion", "==", codigoInput.trim().toUpperCase()));
      const snap = await getDocs(q);

      if (snap.empty) {
        Swal.fire({
          title: "Código Inválido",
          text: "No se encontró ningún grupo con ese código.",
          icon: "error",
          background: 'var(--color-surface)',
          color: 'var(--color-text-main)'
        });
        return;
      }

      const grupoDoc = snap.docs[0];
      const data = grupoDoc.data();

      if (data.miembros.includes(user.email)) {
        Swal.fire({
          title: "Ya sos miembro",
          text: "Ya estás en este grupo.",
          icon: "info",
          background: 'var(--color-surface)',
          color: 'var(--color-text-main)'
        });
        return;
      }

      await updateDoc(doc(db, "grupos", grupoDoc.id), {
        miembros: [...data.miembros, user.email]
      });

      Swal.fire({
        title: `¡Te uniste a "${data.nombre}"! 💪`,
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        background: 'var(--color-surface)',
        color: 'var(--color-text-main)'
      });

      setCodigoInput("");
      setModo("lista");
      cargarGrupos();
    } catch (e) {
      console.error(e);
    }
  };

  const CodigoCopiable = ({ codigo }) => {
    const [copiado, setCopiado] = useState(false);
    const copiar = (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    };
    return (
      <button onClick={copiar} className="flex items-center gap-1.5 text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20 hover:bg-primary/20 transition-all font-mono" title="Copiar código">
        {copiado ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
        <span>{codigo}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/10 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Header Navigation */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-30">
        <button onClick={toggleTheme} className="p-3 rounded-2xl bg-surface/50 backdrop-blur-sm border border-borderBase text-textMuted hover:text-textMain hover:border-primary/50 transition-all shadow-sm">
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button onClick={() => signOut(auth)} className="p-3 rounded-2xl bg-red-500/5 backdrop-blur-sm border border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm" title="Salir">
          <LogOut size={20} />
        </button>
      </div>

      <div className="w-full max-w-2xl relative z-20 animate-fade-in px-2">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold mb-4 border border-primary/20">
            <Users size={14} /> MULTI-TENANT SYSTEM
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-textMain mb-3 tracking-tight">Elegí tu grupo <span className="text-primary italic">Fitness</span></h1>
          <p className="text-textMuted text-lg">Hola <span className="text-textMain font-bold underline decoration-primary/40 underline-offset-4">{user.displayName}</span>, ¿qué equipo te acompaña hoy?</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary shadow-[0_0_20px_rgba(59,130,246,0.3)]"></div>
            <p className="text-textMuted font-medium animate-pulse">Cargando tus grupos...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Mode Selector Tabs */}
            <div className="flex bg-surface/50 backdrop-blur-md p-1.5 rounded-2xl border border-borderBase shadow-sm mb-2">
              <button 
                onClick={() => setModo("lista")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${modo === "lista" ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-textMuted hover:text-textMain"}`}
              >
                <Users size={18} /> Mis Grupos
              </button>
              <button 
                onClick={() => setModo("crear")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${modo === "crear" ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-textMuted hover:text-textMain"}`}
              >
                <Plus size={18} /> Crear
              </button>
              <button 
                onClick={() => setModo("unirse")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${modo === "unirse" ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-textMuted hover:text-textMain"}`}
              >
                <KeyRound size={18} /> Unirme
              </button>
            </div>

            <div className="min-h-[300px]">
              {modo === "lista" && (
                <div className="space-y-4 animate-slide-up">
                  {grupos.length === 0 ? (
                    <div className="glass-panel p-12 text-center">
                      <div className="w-20 h-20 bg-surfaceHighlight rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-borderBase">
                        <Users size={40} className="text-textMuted" />
                      </div>
                      <h3 className="text-xl font-bold text-textMain mb-2">No tenés grupos todavía</h3>
                      <p className="text-textMuted mb-8 max-w-xs mx-auto">Comenzá creando un grupo nuevo o pedile el código a un amigo para unirte.</p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button onClick={() => setModo("crear")} className="btn-primary">Crear mi primer grupo</button>
                        <button onClick={() => setModo("unirse")} className="btn-secondary">Unirme a uno</button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {grupos.map((g, i) => (
                        <button 
                          key={g.id} 
                          onClick={() => onSelectGrupo(g)}
                          className="glass-panel p-6 text-left group hover:border-primary hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 flex flex-col relative overflow-hidden"
                          style={{ animationDelay: `${i * 100}ms` }}
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                          
                          <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300 shadow-inner">
                              {g.nombre.includes("Miller") ? "🏢" : "💪"}
                            </div>
                            <CodigoCopiable codigo={g.codigoInvitacion} />
                          </div>
                          
                          <div className="relative z-10">
                            <h3 className="text-xl font-black text-textMain mb-1 group-hover:text-primary transition-colors tracking-tight">{g.nombre}</h3>
                            <div className="flex items-center gap-4 text-textMuted text-sm font-medium">
                              <span className="flex items-center gap-1.5 bg-surfaceHighlight/50 px-2 py-1 rounded-lg border border-borderBase">
                                <Users size={14} className="text-primary" /> {g.miembros?.length || 0} miembros
                              </span>
                              {g.adminEmail === user.email && (
                                <span className="flex items-center gap-1.5 text-accent font-bold uppercase text-[10px] tracking-wider">
                                  <ShieldCheck size={12} /> Propietario
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-6 flex items-center justify-between text-primary font-bold text-sm group-hover:translate-x-2 transition-transform duration-300 relative z-10">
                            Entrar al grupo <Plus size={16} />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {modo === "crear" && (
                <div className="glass-panel p-8 md:p-10 animate-slide-up relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                      <Plus size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-textMain tracking-tight">Crear Grupo Nuevo</h2>
                      <p className="text-textMuted text-sm">Convertite en el admin de un nuevo equipo</p>
                    </div>
                  </div>
                  <form onSubmit={crearGrupo} className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-textMain mb-2 ml-1">Nombre del Equipo</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Los Pibes de Miller, Strong Team..." 
                        className="input-field text-lg" 
                        value={nombreNuevo} 
                        onChange={e => setNombreNuevo(e.target.value)} 
                        required 
                        autoFocus 
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button type="submit" className="btn-primary flex-[2] py-4 text-lg">Confirmar Creación</button>
                      <button type="button" onClick={() => setModo("lista")} className="btn-secondary flex-1 py-4">Volver</button>
                    </div>
                  </form>
                </div>
              )}

              {modo === "unirse" && (
                <div className="glass-panel p-8 md:p-10 animate-slide-up relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-accent" />
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-accent/10 rounded-2xl text-accent">
                      <KeyRound size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-textMain tracking-tight">Unirse con Código</h2>
                      <p className="text-textMuted text-sm">Ingresá el código que te pasó tu amigo</p>
                    </div>
                  </div>
                  <form onSubmit={unirseConCodigo} className="space-y-6 text-center">
                    <div>
                      <label className="block text-sm font-bold text-textMain mb-4">Código de Invitación</label>
                      <input 
                        type="text" 
                        placeholder="GYM-XXXX" 
                        className="input-field text-center font-black text-3xl tracking-[0.2em] uppercase py-6 border-dashed border-2 focus:border-accent focus:ring-accent/20" 
                        value={codigoInput} 
                        onChange={e => setCodigoInput(e.target.value)} 
                        required 
                        autoFocus 
                        maxLength={8} 
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button type="submit" className="btn-accent flex-[2] py-4 text-lg !text-slate-900">Unirse al Equipo</button>
                      <button type="button" onClick={() => setModo("lista")} className="btn-secondary flex-1 py-4">Volver</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-center mt-12 text-textMuted text-xs font-medium tracking-widest uppercase">
          Gym Tracker v2.0 • Modern Multitenancy
        </p>
      </div>
    </div>
  );
}
