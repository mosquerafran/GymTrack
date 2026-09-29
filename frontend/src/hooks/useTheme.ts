import { useState, useEffect } from "react";

type Theme = "dark" | "light";

// Mismos colores que --color-background de index.css (barra del navegador / status bar).
const COLOR_BARRA: Record<Theme, string> = { dark: "#0b0b0b", light: "#ededea" };

/**
 * Hook para gestionar el tema dark/light.
 * Persiste la preferencia en localStorage, aplica la clase al <html>, y hace que la barra
 * del navegador y los controles nativos (color-scheme) sigan al tema elegido en la app.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem("theme") as Theme) || "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", COLOR_BARRA[theme]);
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* modo privado: el tema vale solo por esta sesión */
    }
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return { theme, toggleTheme };
}
