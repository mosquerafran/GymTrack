import React from "react";
import { Dumbbell, Footprints, Hexagon, LucideProps } from "lucide-react";
import { TipoEntreno } from "../config/entrenos";

/**
 * Pelota de fútbol de línea, con el pentágono central (lucide no trae una). Mismo trazo y
 * tamaño que los íconos de lucide para que conviva con ellos.
 */
function PelotaFutbol({ size = 24, strokeWidth = 2, className, ...resto }: LucideProps): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...resto}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7.5l4.3 3.1-1.6 5h-5.4l-1.6-5z" />
      <path d="M12 7.5V2M16.3 10.6l5.2-1.7M14.7 15.6l3.2 4.5M9.3 15.6l-3.2 4.5M7.7 10.6L2.5 8.9" />
    </svg>
  );
}

const ICONOS: Record<TipoEntreno, React.ComponentType<LucideProps>> = {
  gym: Dumbbell,
  futbol: PelotaFutbol,
  running: Footprints,
  otro: Hexagon,
};

/** Ícono de línea de cada tipo de entreno (reemplaza a los emojis). Decorativo: va con el nombre al lado. */
export default function IconoTipo({ tipo, ...props }: { tipo: TipoEntreno } & LucideProps): React.ReactElement {
  const Icono = ICONOS[tipo];
  return <Icono aria-hidden="true" {...props} />;
}
