import CategoriaCreator from "../components/CategoriaCreator";

export default function Settings({ user }) {
  return (
    <div style={{ width: "70%", margin: "2% auto" }}>
      <h2>Configuración</h2>
      <CategoriaCreator user={user} />
    </div>
  );
}