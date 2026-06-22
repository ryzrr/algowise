import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  EASY: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  HARD: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  UNKNOWN: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
};

const DOT_STYLES: Record<string, string> = {
  EASY: "bg-emerald-400",
  MEDIUM: "bg-amber-400",
  HARD: "bg-rose-400",
  UNKNOWN: "bg-zinc-400",
};

const LABELS: Record<string, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
  UNKNOWN: "—",
};

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STYLES[difficulty] ?? STYLES.UNKNOWN
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT_STYLES[difficulty] ?? DOT_STYLES.UNKNOWN)} />
      {LABELS[difficulty] ?? difficulty}
    </span>
  );
}
