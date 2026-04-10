"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = (typeof window !== "undefined" && (localStorage.getItem("covenant-theme") as Theme | null)) || null;
    const initial: Theme = stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("covenant-theme", next);
    } catch {
      // ignore quota / privacy mode
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted && theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={mounted && theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`focus-ring inline-flex size-10 items-center justify-center rounded-panel border border-line bg-white text-graphite hover:text-ink ${className}`}
    >
      {mounted && theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
