"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type PillBarItem = {
  label: string;
  solved: number;
  remaining: number;
  colorClass: string;
};

export function PillBarChart({ items }: { items: PillBarItem[] }) {
  return (
    <div className="flex w-full flex-col gap-4">
      {items.map((item, i) => {
        const total = item.solved + item.remaining;
        const pct = total > 0 ? Math.round((item.solved / total) * 100) : 0;
        return (
          <div key={item.label} className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold tabular-nums",
                item.colorClass
              )}
            >
              {item.solved}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {item.solved}/{total}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                  className={cn("h-full rounded-full", item.colorClass.split(" ")[0])}
                />
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
