import { useState, useEffect } from "react";

type Theme = "dark" | "light";

/**
 * Hook para gestionar el tema dark/light.
 * Persiste la preferencia en localStorage y aplica la clase al <html>.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("theme") as Theme) || "dark");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return { theme, toggleTheme };
}
