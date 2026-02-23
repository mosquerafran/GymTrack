import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../css/Calendar.css";
import Swal from "sweetalert2";

export default function CalendarView({ fecha, setFecha, entrenos, categoriasMap, onMonthChange }) {

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

  return (
    <div className="calendar-wrapper">
      <Calendar
        onChange={setFecha}
        value={fecha}
      />
    </div>
  );
}