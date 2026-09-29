import React from "react";
import { User } from "firebase/auth";
import CategoriaCreator from "../components/CategoriaCreator";
import MetaSemanalConfig from "../components/MetaSemanalConfig";
import SexoConfig from "../components/SexoConfig";
import { Settings as SettingsIcon } from "lucide-react";

interface SettingsProps {
  user: User;
}

export default function Settings({ user }: SettingsProps): React.ReactElement {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="glass-panel p-6 border-b-4 border-b-accent">
        <h2 className="text-2xl font-bold text-textMain flex items-center gap-2">
          <SettingsIcon className="text-accent" /> Configuración de Cuenta
        </h2>
        <p className="text-textMuted mt-2 text-sm">Tu cuerpo, tu meta semanal y tus etiquetas.</p>
      </div>
      <SexoConfig user={user} />
      <MetaSemanalConfig user={user} />
      <CategoriaCreator user={user} />
    </div>
  );
}
