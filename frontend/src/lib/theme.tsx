"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { PageCurlProvider, useCurlTransition } from "@/components/PageCurlTransition";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
  mounted: false,
});

function ThemeInternalProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);
  const { startCurl } = useCurlTransition();
  const themeRef = useRef<Theme>("dark");
  themeRef.current = theme;

  useEffect(() => {
    try {
      const stored = localStorage.getItem("epl-theme") as Theme | null;
      if (stored === "light" || stored === "dark") {
        setThemeState(stored);
        applyTheme(stored);
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialTheme: Theme = prefersDark ? "dark" : "light";
        setThemeState(initialTheme);
        applyTheme(initialTheme);
      }
    } catch {
      // Fallback
    } finally {
      setMounted(true);
    }
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  };

  const setTheme = useCallback((newTheme: Theme) => {
    if (newTheme === themeRef.current) return;
    startCurl(newTheme, () => {
      setThemeState(newTheme);
      applyTheme(newTheme);
      try {
        localStorage.setItem("epl-theme", newTheme);
      } catch {}
    });
  }, [startCurl]);

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = themeRef.current === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <PageCurlProvider>
      <ThemeInternalProvider>{children}</ThemeInternalProvider>
    </PageCurlProvider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
