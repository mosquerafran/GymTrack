import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../css/Calendar.css";
import Swal from "sweetalert2";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function DiaDetalle({ user }) {

  const [fecha, setFecha] = useState(new Date());
  const [entrenos, setEntrenos] = useState({});
  const [categoriasMap, setCategoriasMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [detalleDia, setDetalleDia] = useState({}); // <-- detalle del día

  const formatDate = (date)=>{
    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,"0");
    const d = String(date.getDate()).padStart(2,"0");
    return `${y}-${m}-${d}`;
  };

  const mostrarEntrenos = (tiene)=>{
    Swal.fire({
      title: tiene ? "Entrenaste 💪" : "Descanso 😴",
      text: tiene
        ? tiene.map(id => categoriasMap?.[id] || "…").join(", ")
        : "No entrenaste ese día",
      icon: tiene ? "success" : "info",
      confirmButtonText: "OK"
    });
  };

  // Cargar categorías
  const cargarCategorias = async () => {
    try{
      const snap = await getDocs(collection(db,"categorias"));
      const mapa = {};
      snap.forEach(doc=>{
        mapa[doc.id] = doc.data().nombre;
      });
      setCategoriasMap(mapa);
    }catch(err){
      console.error("❌ Error cargando categorías:", err);
    }
  };

  // Cargar entrenamientos del mes
  const cargarEntrenosMes = async (fechaActual) => {
    if(!user) return;

    setLoading(true);

    const inicioMes = new Date(fechaActual.getFullYear(),fechaActual.getMonth(),1);
    const finMes = new Date(fechaActual.getFullYear(),fechaActual.getMonth()+1,0);

    const inicioStr = inicioMes.toISOString().split("T")[0];
    const finStr = finMes.toISOString().split("T")[0];

    try{
      const q = query(
        collection(db,"asistencias"),
        where("userName","==",user.displayName),
        where("fecha",">=",inicioStr),
        where("fecha","<=",finStr)
      );

      const snap = await getDocs(q);
      const mapa = {};

      snap.forEach(doc=>{
        const data = doc.data();
        const fechaKey = data.fecha;
        if(!mapa[fechaKey]) mapa[fechaKey] = [];
        mapa[fechaKey].push(data.categoriaId);
      });

      setEntrenos(mapa);

      // Actualizar detalle del día seleccionado
      const keyDia = formatDate(fecha);
      const idsDia = mapa[keyDia] || [];
      const detalle = {};
      if(idsDia.length > 0) detalle[user.displayName] = idsDia.map(id => categoriasMap[id] || "Sin categoría");
      setDetalleDia(detalle);

    }catch(err){
      console.error("❌ Error cargando entrenos del mes:",err);
    }

    setLoading(false);
  };

  // Hook inicial
  useEffect(()=>{
    cargarCategorias();
    cargarEntrenosMes(fecha);
  }, [user]);

  // Cada vez que cambia la fecha, actualizar detalle del día
  useEffect(()=>{
    const key = formatDate(fecha);
    const idsDia = entrenos[key] || [];
    const detalle = {};
    if(idsDia.length > 0) detalle[user.displayName] = idsDia.map(id => categoriasMap[id] || "Sin categoría");
    setDetalleDia(detalle);
  }, [fecha, entrenos, categoriasMap]);

  return (
    <div style={{padding:20}}>

      <div className="calendar-wrapper">
        <Calendar
          onChange={setFecha}
          value={fecha}

          onActiveStartDateChange={({activeStartDate})=>{
            cargarEntrenosMes(activeStartDate);
          }}

          tileContent={({ date, view })=>{
            if(view !== "month") return null;

            const key = formatDate(date);
            const hoy = new Date();
            hoy.setHours(0,0,0,0);

            const esPasado = date < hoy;
            const tiene = entrenos[key];

            let color = null;
            if(tiene) color="green";
            else if(esPasado) color="red";
            else return null;

            return (
              <div style={{ marginTop:4, display:"flex", justifyContent:"center" }}>
                <div
                  className="dot-indicator"
                  style={{ background: color }}
                  onClick={(e)=>{
                    e.stopPropagation();
                    mostrarEntrenos(tiene);
                  }}
                />
              </div>
            );
          }}
        />
      </div>

      <h2 style={{marginTop:20}}>Entrenamientos del {formatDate(fecha)}</h2>

      {loading && <p>Cargando...</p>}

      {!loading && Object.keys(detalleDia).length === 0 && <p>Nadie entrenó pajeros</p>}

      {!loading && Object.entries(detalleDia).map(([userName, lista])=>(
        <div key={userName} style={{marginBottom:10}}>
          <strong>{userName}:</strong>
          <ul>
            {lista.map((c,i)=>(<li key={i}>{c}</li>))}
          </ul>
        </div>
      ))}

    </div>
  );
}