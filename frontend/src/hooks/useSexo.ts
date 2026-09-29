import { useEffect, useState } from "react";
import { obtenerSexo } from "../services/usuarioService";
import { Sexo, SEXO_DEFAULT } from "../config/entrenos";

/**
 * Sexo del usuario (modelo del cuerpo). Arranca con el default y se corrige cuando
 * llega el doc: el cuerpo se dibuja al instante y a lo sumo cambia de modelo una vez.
 */
export function useSexo(email: string | null | undefined): Sexo {
  const [sexo, setSexo] = useState<Sexo>(SEXO_DEFAULT);

  useEffect(() => {
    if (!email) return;
    let vivo = true;
    obtenerSexo(email)
      .then((s) => { if (vivo) setSexo(s); })
      .catch((e) => console.warn("No se pudo leer el sexo del usuario; uso el default.", e));
    return () => { vivo = false; };
  }, [email]);

  return sexo;
}
