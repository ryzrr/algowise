"use client";

import { motion } from "framer-motion";
import { avatarGradient } from "@/lib/utils";
import { DifficultyBadge } from "@/components/difficulty-badge";

export type TimelineItem = {
  title: string;
  company: string | null;
  difficulty: string;
  solvedAt: Date;
  frequency: number;
};

function relativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

export function ActivityTimeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Nothing solved yet — go pick a fight with Two Sum.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.05 }}
          className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/50"
        >
          <div
            className={`flex size-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-xs font-semibold ${avatarGradient(
              item.company ?? item.title
            )}`}
          >
            {(item.company ?? item.title).slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.title}</p>
            {item.company && (
              <p className="truncate text-xs text-muted-foreground">{item.company}</p>
            )}
          </div>
          <DifficultyBadge difficulty={item.difficulty} />
          <span className="hidden shrink-0 font-mono text-xs tabular-nums text-muted-foreground sm:inline">
            asked {item.frequency}x
          </span>
          <span className="w-8 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
            {relativeTime(item.solvedAt)}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
