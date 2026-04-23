import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { ShieldCheck, UserPlus, Trash2, Mail, UserCheck } from "lucide-react";
import Swal from "sweetalert2";

const ADMIN_EMAIL = "mosquerafran265@gmail.com";

export default function Admin({ user, grupoActivo, setView }) {
  const [miembros, setMiembros] = useState([]);
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (grupoActivo) {
      cargarMiembros();
    }
  }, [grupoActivo]);

  const cargarMiembros = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "grupos"), where("codigoInvitacion", "==", grupoActivo.codigoInvitacion)));
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setMiembros(data.miembros || []);
      }
    } catch (error) {
      console.error("Error al cargar miembros:", error);
    }
    setLoading(false);
  };

  const agregarMiembro = async (e) => {
    e.preventDefault();
    const email = nuevoEmail.toLowerCase().trim();
    if (!email || !email.includes("@")) return;

    if (miembros.includes(email)) {
      Swal.fire({ title: "Atención", text: "Ya es miembro.", icon: "warning" });
      return;
    }

    try {
      await updateDoc(doc(db, "grupos", grupoActivo.id), {
        miembros: [...miembros, email]
      });
      setNuevoEmail("");
      cargarMiembros();
      Swal.fire({ title: "Agregado", icon: "success", toast: true, position: "top-end", timer: 1500 });
    } catch (error) { console.error(error); }
  };

  const eliminarMiembro = async (email) => {
    if (email === ADMIN_EMAIL) return;
    const res = await Swal.fire({
      title: "¿Quitar del grupo?",
      text: `${email} ya no verá este grupo.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, quitar"
    });

    if (res.isConfirmed) {
      const nuevosMiembros = miembros.filter(m => m !== email);
      await updateDoc(doc(db, "grupos", grupoActivo.id), { miembros: nuevosMiembros });
      cargarMiembros();
    }
  };

  if (user?.email !== ADMIN_EMAIL && grupoActivo?.adminEmail !== user?.email) {
    return (
      <div className="glass-panel p-10 text-center animate-fade-in">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Acceso Denegado</h2>
        <p className="text-textMuted">Solo el administrador del grupo puede ver esta página.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="glass-panel p-6 md:p-8 border-t-4 border-t-primary">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-textMain flex items-center gap-2 mb-2">
              <ShieldCheck className="text-primary" size={28} /> Admin: {grupoActivo?.nombre}
            </h2>
            <p className="text-textMuted">Gestioná los integrantes y acceso al grupo.</p>
          </div>
          {user.email === ADMIN_EMAIL && (
            <button 
              onClick={() => setView("aprobaciones")} 
              className="flex items-center gap-2 text-xs bg-yellow-500/10 text-yellow-500 px-3 py-2 rounded-xl border border-yellow-500/20 hover:bg-yellow-500 hover:text-slate-900 transition-all font-bold"
            >
              <UserCheck size={16} /> Aprobaciones Globales
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel p-6 md:p-8">
        <h3 className="text-lg font-bold text-textMain mb-4">Invitar por Email</h3>
        <form onSubmit={agregarMiembro} className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              className="input-field pl-10 w-full"
              value={nuevoEmail}
              onChange={(e) => setNuevoEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary flex justify-center items-center gap-2">
            <UserPlus size={18} /> Agregar
          </button>
        </form>

        <div className="flex items-center justify-between mb-4 border-b border-borderBase pb-2">
          <h3 className="text-lg font-bold text-textMain">Miembros Actuales ({miembros.length})</h3>
          <div className="text-xs text-textMuted bg-surfaceHighlight px-2 py-1 rounded-lg font-mono">
            Código: {grupoActivo?.codigoInvitacion}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-3">
            {miembros.map((m, i) => (
              <div key={i} className="bg-surfaceHighlight/50 border border-borderBase rounded-xl p-4 flex items-center justify-between group transition-all hover:border-primary/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {m.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-textMain">{m}</p>
                    {m === ADMIN_EMAIL && (
                      <span className="text-[10px] bg-accent text-slate-900 px-2 py-0.5 rounded-full font-bold mt-1 inline-block">Master Admin</span>
                    )}
                  </div>
                </div>
                
                {m !== ADMIN_EMAIL && m !== grupoActivo.adminEmail && (
                  <button onClick={() => eliminarMiembro(m)} className="text-textMuted hover:text-red-500 p-2">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
