import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { Users, Plus, KeyRound, LogOut, Sun, Moon, Copy, Check } from "lucide-react";
import Swal from "sweetalert2";

const ADMIN_EMAIL = "mosquerafran265@gmail.com";

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
      // Verificar si es primera vez (migración)
      const allGrupos = await getDocs(collection(db, "grupos"));
      
      if (allGrupos.empty && user.email === ADMIN_EMAIL) {
        await migrarDatos();
        return cargarGrupos();
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
    
    const miembros = [
      "mosquerafran265@gmail.com",
      "rravenna59@gmail.com",
      "pedrozaffino@gmail.com",
      "jgonzalezgalceran@gmail.com"
    ];

    // Crear grupo por defecto
    const grupoRef = await addDoc(collection(db, "grupos"), {
      nombre: "Gym ave Miller 2026",
      adminEmail: ADMIN_EMAIL,
      miembros: miembros,
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
    const copiar = () => {
      navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    };
    return (
      <button onClick={copiar} className="flex items-center gap-1 text-xs bg-surface px-2 py-1 rounded-lg border border-borderBase hover:border-primary/50 transition-colors" title="Copiar código">
        {copiado ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
        <span className="font-mono">{codigo}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Header */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <button onClick={toggleTheme} className="p-2 rounded-xl text-textMuted hover:text-textMain hover:bg-surfaceHighlight transition-all">
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button onClick={() => signOut(auth)} className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-all" title="Salir">
          <LogOut size={20} />
        </button>
      </div>

      <div className="w-full max-w-2xl relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-textMain mb-2">Elegí tu grupo 💪</h1>
          <p className="text-textMuted">Hola <span className="text-primary font-semibold">{user.displayName}</span>, ¿a cuál grupo entrás hoy?</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : modo === "crear" ? (
          <div className="glass-panel p-6 md:p-8 animate-slide-up">
            <h2 className="text-xl font-bold text-textMain mb-4 flex items-center gap-2"><Plus size={20} className="text-primary" /> Crear Grupo Nuevo</h2>
            <form onSubmit={crearGrupo} className="space-y-4">
              <input type="text" placeholder="Nombre del grupo (ej: Los Pibes del Gym)" className="input-field w-full" value={nombreNuevo} onChange={e => setNombreNuevo(e.target.value)} required autoFocus />
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Crear Grupo</button>
                <button type="button" onClick={() => setModo("lista")} className="btn-secondary flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        ) : modo === "unirse" ? (
          <div className="glass-panel p-6 md:p-8 animate-slide-up">
            <h2 className="text-xl font-bold text-textMain mb-4 flex items-center gap-2"><KeyRound size={20} className="text-accent" /> Unirme con Código</h2>
            <form onSubmit={unirseConCodigo} className="space-y-4">
              <input type="text" placeholder="Ej: GYM-XK92" className="input-field w-full text-center font-mono text-xl tracking-widest uppercase" value={codigoInput} onChange={e => setCodigoInput(e.target.value)} required autoFocus maxLength={8} />
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Unirme</button>
                <button type="button" onClick={() => setModo("lista")} className="btn-secondary flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {grupos.length === 0 ? (
              <div className="glass-panel p-10 text-center text-textMuted animate-slide-up">
                <span className="text-4xl block mb-4">🏋️</span>
                <p className="mb-2 font-medium text-textMain">No tenés grupos todavía</p>
                <p className="text-sm">Creá uno nuevo o pedile el código a un amigo.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {grupos.map((g, i) => (
                  <button 
                    key={g.id} 
                    onClick={() => onSelectGrupo(g)}
                    className="glass-panel p-6 text-left animate-slide-up hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        💪
                      </div>
                      <CodigoCopiable codigo={g.codigoInvitacion} />
                    </div>
                    <h3 className="text-lg font-bold text-textMain mb-1 group-hover:text-primary transition-colors">{g.nombre}</h3>
                    <div className="flex items-center gap-1 text-textMuted text-sm">
                      <Users size={14} /> {g.miembros?.length || 0} miembros
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setModo("crear")} className="btn-primary flex-1 py-3">
                <Plus size={20} /> Crear Grupo
              </button>
              <button onClick={() => setModo("unirse")} className="btn-secondary flex-1 py-3">
                <KeyRound size={20} /> Unirme con Código
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
