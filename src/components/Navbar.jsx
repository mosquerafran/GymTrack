import { Group, Button, Text } from "@mantine/core";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

export default function Navbar({ view, setView, user }) {
  const logout = async () => {
    await signOut(auth);
  };

  return (
    <Group justify="space-between" px="md" py="sm" style={{ background: "#f5efe6" }}>
      <Group>
        <Button
          variant={view === "home" ? "filled" : "subtle"}
          color="yellow"
          onClick={() => setView("home")}
        >
          Home
        </Button>

        <Button
          variant={view === "stats" ? "filled" : "subtle"}
          color="yellow"
          onClick={() => setView("stats")}
        >
          Estadísticas
        </Button>

          <Button
          variant={view === "dayDetail" ? "filled" : "subtle"}
          color="yellow"
          onClick={() => setView("dayDetail")}
        >
          Detalles de día
        </Button>
      </Group>

      <Group>
        <Text
          size="sm"
          style={{ cursor: "pointer" }}
          onClick={() => setView("settings")}
        >
          {user.displayName}
        </Text>

        <Button variant="light" color="yellow" onClick={logout}>
          Salir
        </Button>
      </Group>
    </Group>
  );
}