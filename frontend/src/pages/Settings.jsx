import CategoriaCreator from "../components/CategoriaCreator";
import { Settings as SettingsIcon } from "lucide-react";

export default function Settings({ user }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="glass-panel p-6 border-b-4 border-b-accent">
        <h2 className="text-2xl font-bold text-textMain flex items-center gap-2">
          <SettingsIcon className="text-accent" /> Configuración de Cuenta
        </h2>
        <p className="text-textMuted mt-2 text-sm">Gestiona tus categorías y opciones de la aplicación.</p>
      </div>
      <CategoriaCreator user={user} />
    </div>
  );
}
