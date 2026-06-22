"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className={cn(
        "relative flex size-9 items-center justify-center rounded-md border border-border bg-card/60 text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95",
        className
      )}
    >
      {/* Sun icon - shown in dark mode (click to go light) */}
      <Sun
        className={cn(
          "absolute size-4 transition-all duration-300",
          theme === "dark"
            ? "scale-100 rotate-0 opacity-100"
            : "scale-50 rotate-90 opacity-0"
        )}
      />
      {/* Moon icon - shown in light mode (click to go dark) */}
      <Moon
        className={cn(
          "absolute size-4 transition-all duration-300",
          theme === "light"
            ? "scale-100 rotate-0 opacity-100"
            : "scale-50 -rotate-90 opacity-0"
        )}
      />
    </button>
  );
}
