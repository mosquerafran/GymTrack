import { useState, useEffect, Suspense, lazy } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs, addDoc, doc, getDoc, setDoc } from "firebase/firestore";

import Login from "./components/Login";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";

// Lazy Loading
const Stats = lazy(() => import("./pages/Stats"));
const Settings = lazy(() => import("./pages/Settings"));
const DiaDetalle = lazy(() => import("./pages/DiaDetalle"));
const Admin = lazy(() => import("./pages/Admin"));
const Aprobaciones = lazy(() => import("./pages/Aprobaciones"));
const GrupoSelector = lazy(() => import("./pages/GrupoSelector"));

const ADMIN_EMAIL = "mosquerafran265@gmail.com";
const MIEMBROS_MILLER = [
  "mosquerafran265@gmail.com",
  "rravenna59@gmail.com",
  "pedrozaffino@gmail.com",
  "jgonzalezgalceran@gmail.com"
];

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState(new Date());
  const [view, setView] = useState("home");
  const [fechaDetalle, setFechaDetalle] = useState(null);

  // Estado del usuario: null (cargando), "aprobado", "pendiente", "rechazado"
  const [estadoUsuario, setEstadoUsuario] = useState(null);
  // Grupo activo
  const [grupoActivo, setGrupoActivo] = useState(null);
  const [errorAuth, setErrorAuth] = useState(null);

  // Tema
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setEstadoUsuario(null);
        setGrupoActivo(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Verificar estado del usuario cuando se loguea
  useEffect(() => {
    if (!user) return;
    setErrorAuth(null);
    verificarEstado();
  }, [user]);

  const verificarEstado = async () => {
    try {
      const isVip = MIEMBROS_MILLER.includes(user.email);

      // Admin maestro o amigos VIP: siempre aprobados
      if (user.email === ADMIN_EMAIL || isVip) {
        setEstadoUsuario("aprobado");
        restaurarCategorias(user);
        cargarGrupoGuardado();
        
        // Asegurar que existan en la colección 'usuarios'
        await setDoc(doc(db, "usuarios", user.email), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || "",
          photoURL: user.photoURL || "",
          estado: "aprobado",
          creadoEn: new Date().toISOString()
        }, { merge: true });
        return;
      }

      // 1. Buscar en la colección nueva 'usuarios' por email
      const docRef = doc(db, "usuarios", user.email);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const estado = docSnap.data().estado;
        setEstadoUsuario(estado);
        if (estado === "aprobado") {
          restaurarCategorias(user);
          cargarGrupoGuardado();
        }
        if (estado === "rechazado") await signOut(auth);
        return;
      }

      // 2. MIGRACIÓN: Buscar en la colección vieja 'usuariosPendientes' (por email o por query)
      const oldDocRef = doc(db, "usuariosPendientes", user.email);
      const oldDocSnap = await getDoc(oldDocRef);
      let userData = null;

      if (oldDocSnap.exists()) {
        userData = oldDocSnap.data();
      } else {
        // Buscar por query en caso de que el ID fuera autogenerado
        const qOld = query(collection(db, "usuariosPendientes"), where("email", "==", user.email));
        const snapOld = await getDocs(qOld);
        if (!snapOld.empty) userData = snapOld.docs[0].data();
      }

      // 3. MIGRACIÓN: Buscar en 'usuariosPermitidos' (muy vieja)
      if (!userData) {
        const qPerm = query(collection(db, "usuariosPermitidos"), where("email", "==", user.email));
        const snapPerm = await getDocs(qPerm);
        if (!snapPerm.empty) userData = { ...snapPerm.docs[0].data(), estado: "aprobado" };
      }

      // Si encontramos datos en colecciones viejas, migramos a 'usuarios'
      if (userData) {
        const finalData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || userData.displayName || "",
          photoURL: user.photoURL || userData.photoURL || "",
          estado: userData.estado || "aprobado",
          creadoEn: userData.creadoEn || new Date().toISOString(),
          migrado: true
        };
        await setDoc(doc(db, "usuarios", user.email), finalData);
        setEstadoUsuario(finalData.estado);
        if (finalData.estado === "aprobado") {
          restaurarCategorias(user);
          cargarGrupoGuardado();
        }
        return;
      }

      // 4. Usuario totalmente nuevo → auto-aprobar para amigos
      const newUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        estado: "aprobado",
        creadoEn: new Date().toISOString()
      };
      await setDoc(doc(db, "usuarios", user.email), newUser);
      setEstadoUsuario("aprobado");
      restaurarCategorias(user);
      cargarGrupoGuardado();
    } catch (e) {
      console.error("Error verificando estado:", e);
      setErrorAuth(e.message || "Error de conexión con el servidor");
    }
  };

  const restaurarCategorias = async (u) => {
    const dataRestauracion = {
      "mosquerafran265@gmail.com": ["Brazos", "Pull", "Futbol", "Pecho-Espalda", "Push", "Legs"],
      "pedrozaffino@gmail.com": ["Espalda-triceps", "Pecho-biceps", "Fútbol", "Pierna-hombro", "Brazos-hombro", "Pecho-espalda"],
      "jgonzalezgalceran@gmail.com": ["Running 🏳️‍🌈", "Torso", "Patas", "Empuje", "Minubi 🥵", "Tracción"],
      "rravenna59@gmail.com": ["Push", "Legs", "Hikking", "Pull", "Brazos"]
    };

    const misCategorias = dataRestauracion[u.email];
    if (!misCategorias) return;

    try {
      // Verificar si ya tiene categorías vinculadas a su UID
      const q = query(collection(db, "categorias"), where("userId", "==", u.uid));
      const snap = await getDocs(q);

      if (snap.empty) {
        console.log(`Reparando categorías personales para ${u.email}...`);
        for (const catName of misCategorias) {
          await addDoc(collection(db, "categorias"), {
            userId: u.uid,
            nombre: catName,
            cuenta: true,
            activo: true
          });
        }
      }
    } catch (e) {
      console.error("Error en restauración:", e);
    }
  };

  const cargarGrupoGuardado = () => {
    const savedGrupoId = localStorage.getItem("grupoActivo");
    if (savedGrupoId) {
      // Verificar que el grupo todavía existe
      getDoc(doc(db, "grupos", savedGrupoId)).then(snap => {
        if (snap.exists() && snap.data().miembros?.includes(user.email)) {
          setGrupoActivo({ id: snap.id, ...snap.data() });
        } else {
          localStorage.removeItem("grupoActivo");
        }
      });
    }
  };

  const seleccionarGrupo = (grupo) => {
    setGrupoActivo(grupo);
    localStorage.setItem("grupoActivo", grupo.id);
    setView("home");
  };

  const cambiarGrupo = () => {
    setGrupoActivo(null);
    localStorage.removeItem("grupoActivo");
  };

  const abrirDetalle = (fecha) => {
    setFechaDetalle(fecha);
    setView("dayDetail");
  };

  // Loading
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-300">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
    </div>
  );

  // No logueado
  if (!user) return <Login />;

  // Esperando verificación o Error
  if (estadoUsuario === null) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {errorAuth ? (
        <div className="glass-panel p-8 max-w-sm w-full text-center animate-slide-up border-red-500/30">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-textMain mb-2">Error de Conexión</h2>
          <p className="text-textMuted mb-6 text-sm">{errorAuth}</p>
          <div className="space-y-3">
            <button 
              className="btn-primary w-full py-2"
              onClick={() => {
                setErrorAuth(null);
                verificarEstado();
              }}
            >
              Reintentar
            </button>
            <button 
              className="btn-secondary w-full py-2"
              onClick={() => signOut(auth)}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4"></div>
          <p className="text-textMuted animate-pulse">Verificando acceso...</p>
        </>
      )}
    </div>
  );

  // Pendiente de aprobación
  if (estadoUsuario === "pendiente") return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="glass-panel p-8 md:p-12 max-w-md w-full text-center animate-slide-up">
        <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">⏳</span>
        </div>
        <h1 className="text-2xl font-bold text-textMain mb-3">Solicitud Enviada</h1>
        <p className="text-textMuted mb-6">
          ¡Hola <span className="text-textMain font-semibold">{user.displayName}</span>! Tu solicitud fue enviada al administrador. 
          Cuando te aprueben, podrás entrar.
        </p>
        <button 
          className="btn-secondary w-full py-3"
          onClick={() => signOut(auth)}
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );

  // Selector de grupo (aprobado pero sin grupo seleccionado)
  if (estadoUsuario === "aprobado" && !grupoActivo) return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      }>
        <GrupoSelector user={user} onSelectGrupo={seleccionarGrupo} theme={theme} toggleTheme={toggleTheme} />
      </Suspense>
    </div>
  );

  // App principal
  return (
    <div className="min-h-screen pb-28 md:pb-20 max-w-5xl mx-auto transition-colors duration-300">
      <Navbar 
        view={view} setView={setView} user={user} 
        theme={theme} toggleTheme={toggleTheme} 
        grupoActivo={grupoActivo} onCambiarGrupo={cambiarGrupo}
      />

      <main className="px-4 md:px-8 animate-fade-in relative min-h-[60vh]">
        <Suspense fallback={
          <div className="absolute inset-0 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        }>
          {view === "home" && (
            <Home user={user} fecha={fecha} setFecha={setFecha} abrirDetalle={abrirDetalle} grupoId={grupoActivo?.id} theme={theme} />
          )}
          {view === "stats" && <Stats user={user} grupoId={grupoActivo?.id} />}
          {view === "settings" && <Settings user={user} />}
          {view === "admin" && <Admin user={user} grupoActivo={grupoActivo} setView={setView} />}
          {view === "aprobaciones" && <Aprobaciones user={user} />}
          {view === "dayDetail" && <DiaDetalle fecha={fechaDetalle} user={user} grupoId={grupoActivo?.id} />}
        </Suspense>
      </main>
    </div>
  );
}