import { useEffect, useState } from "react";
import { db } from "../config/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { obtenerUsuarios } from "../services/authService";
import { UserCheck, UserX, ShieldCheck, Clock } from "lucide-react";
import Swal from "sweetalert2";
import { ADMIN_EMAIL } from "../config/constants";

export default function Aprobaciones({ user }) {
  const [pendientes, setPendientes] = useState([]);
  const [aprobados, setAprobados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) cargar();
  }, [user]);

  const cargar = async () => {
    setLoading(true);
    try {
      const { pendientes: pend, aprobados: apr } = await obtenerUsuarios();
      setPendientes(pend);
      setAprobados(apr);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const cambiarEstado = async (id, email, nuevoEstado) => {
    const accion = nuevoEstado === "aprobado" ? "aprobar" : "rechazar";
    const res = await Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} a ${email}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: "Cancelar",
      background: "var(--color-surface)",
      color: "var(--color-text-main)",
    });

    if (res.isConfirmed) {
      await updateDoc(doc(db, "usuarios", id), { estado: nuevoEstado });
      cargar();
    }
  };

  if (user?.email !== ADMIN_EMAIL) {
    return (
      <div className="glass-panel p-10 text-center animate-fade-in">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Acceso Denegado</h2>
        <p className="text-textMuted">Solo el administrador puede ver esta página.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="glass-panel p-6 md:p-8 border-t-4 border-t-yellow-500">
        <h2 className="text-2xl font-bold text-textMain flex items-center gap-2 mb-2">
          <Clock className="text-yellow-500" size={28} /> Solicitudes Pendientes
        </h2>
        <p className="text-textMuted">Usuarios que quieren acceder a la aplicación.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      ) : pendientes.length === 0 ? (
        <div className="glass-panel p-8 text-center text-textMuted">
          <span className="text-3xl block mb-3">✅</span>
          No hay solicitudes pendientes. ¡Todo al día!
        </div>
      ) : (
        <div className="grid gap-3">
          {pendientes.map((u) => (
            <div key={u.id} className="glass-panel p-4 flex items-center justify-between animate-slide-up">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 font-bold">
                  {u.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-textMain">{u.displayName || "Sin nombre"}</p>
                  <p className="text-sm text-textMuted">{u.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => cambiarEstado(u.id, u.email, "aprobado")} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all font-medium text-sm">
                  <UserCheck size={16} /> Aprobar
                </button>
                <button onClick={() => cambiarEstado(u.id, u.email, "rechazado")} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-medium text-sm">
                  <UserX size={16} /> Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {aprobados.length > 0 && (
        <div className="glass-panel p-6 md:p-8">
          <h3 className="text-lg font-bold text-textMain mb-4 flex items-center gap-2">
            <ShieldCheck className="text-green-500" size={20} /> Usuarios Aprobados ({aprobados.length})
          </h3>
          <div className="grid gap-2">
            {aprobados.map((u) => (
              <div key={u.id} className="bg-surfaceHighlight/50 border border-borderBase rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 text-sm font-bold">
                    {u.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-textMain">{u.displayName || u.email}</p>
                    <p className="text-xs text-textMuted">{u.email}</p>
                  </div>
                </div>
                <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-full font-bold">Aprobado</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
