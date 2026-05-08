import { useState, useEffect } from "react";

/**
 * Hook para gestionar el tema dark/light.
 * Persiste la preferencia en localStorage y aplica la clase al <html>.
 *
 * @returns {{ theme, toggleTheme }}
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

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
