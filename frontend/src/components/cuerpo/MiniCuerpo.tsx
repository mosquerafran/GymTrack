import React from "react";
import Cuerpo from "./Cuerpo";
import { Musculo, NOMBRE_MUSCULO, Sexo } from "../../config/entrenos";

interface MiniCuerpoProps {
  sexo: Sexo;
  musculos: Musculo[];
  className?: string;
}

/** Frente y espalda chiquitos con los músculos del entreno (muro, detalle del día). */
export default function MiniCuerpo({ sexo, musculos, className = "" }: MiniCuerpoProps): React.ReactElement {
  const seleccion = new Set(musculos);
  const texto = `Músculos: ${musculos.map((m) => NOMBRE_MUSCULO[m]).join(", ")}`;
  return (
    <div className={`flex gap-0.5 ${className}`} role="img" aria-label={texto}>
      <Cuerpo sexo={sexo} lado="front" seleccion={seleccion} etiqueta="" className="w-10" />
      <Cuerpo sexo={sexo} lado="back" seleccion={seleccion} etiqueta="" className="w-10" />
    </div>
  );
}
