import { useEffect, useState } from "react";

// Apply theme immediately to avoid flash of wrong theme
// This runs as an inline script before React hydrates
if (typeof window !== "undefined") {
  const saved = localStorage.getItem("taj_theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = saved === "dark" || (!saved && prefersDark);
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("taj_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return (saved === "dark" || (!saved && prefersDark)) ? "dark" : "light";
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("taj_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return { theme, toggleTheme, isDark: theme === "dark", mounted };
}
