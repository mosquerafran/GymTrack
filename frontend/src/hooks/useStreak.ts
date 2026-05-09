import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { db } from "../config/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Grupo, Asistencia } from "../types";

/**
 * Hook que calcula la racha de días consecutivos de entrenamiento.
 * Usa onSnapshot para reactividad en tiempo real.
 */
export function useStreak(user: User | null, grupoActivo: Grupo | null) {
  const [streak, setStreak] = useState<number>(0);

  useEffect(() => {
    if (!user || !grupoActivo) {
      setStreak(0);
      return;
    }

    const q = query(
      collection(db, "asistencias"),
      where("userId", "==", user.uid),
      where("grupoId", "==", grupoActivo.id)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      try {
        const fechasSet = new Set<string>();
        snap.forEach((document) => {
          const data = document.data() as Asistencia;
          if (data.fecha) fechasSet.add(data.fecha);
        });

        const fechas = Array.from(fechasSet).sort((a: string, b: string) => b.localeCompare(a));
        if (fechas.length === 0) {
          setStreak(0);
          return;
        }

        const formatDate = (date: Date): string => {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, "0");
          const d = String(date.getDate()).padStart(2, "0");
          return `${y}-${m}-${d}`;
        };

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const strToday = formatDate(today);
        const strYesterday = formatDate(yesterday);

        if (fechas[0] !== strToday && fechas[0] !== strYesterday) {
          setStreak(0);
          return;
        }

        let currentStreak = 0;
        let checkDate = new Date(fechas[0] + "T12:00:00");

        for (const f of fechas) {
          if (f === formatDate(checkDate)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }

        setStreak(currentStreak);
      } catch (e) {
        console.error("Error al calcular racha:", e);
      }
    });

    return () => unsubscribe();
  }, [user, grupoActivo]);

  return streak;
}
