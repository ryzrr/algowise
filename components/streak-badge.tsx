"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function StreakBadge({
  streak,
  solvedToday,
  size = "default",
}: {
  streak: number;
  solvedToday: boolean;
  size?: "default" | "lg";
}) {
  const active = streak > 0;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-mono font-semibold tabular-nums",
        active
          ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
          : "border-border bg-muted/30 text-muted-foreground",
        size === "lg" && "px-4 py-2 text-lg"
      )}
    >
      <motion.span
        animate={
          active && solvedToday
            ? { scale: [1, 1.25, 1] }
            : { scale: 1 }
        }
        transition={{ duration: 0.6, repeat: solvedToday ? Infinity : 0, repeatDelay: 2 }}
      >
        <Flame className={cn(size === "lg" ? "size-5" : "size-4", active && "fill-orange-500/40")} />
      </motion.span>
      <span>{streak}</span>
      <span className="hidden text-xs font-normal text-muted-foreground sm:inline">
        day{streak === 1 ? "" : "s"}
      </span>
    </div>
  );
}
