import { auth } from "@/lib/auth";
import { getMatchScores } from "@/lib/data";
import { redirect } from "next/navigation";
import { Zap, TrendingUp, Target, BookOpen } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { MatchResult } from "@/lib/match";

function tierConfig(tier: MatchResult["tier"]) {
  switch (tier) {
    case "elite":
      return {
        label: "Elite",
        bg: "bg-emerald-500/10 dark:bg-emerald-500/10",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        ring: "ring-emerald-500/40",
        bar: "bg-emerald-500",
        glow: "shadow-emerald-500/20",
      };
    case "strong":
      return {
        label: "Strong",
        bg: "bg-primary/10",
        border: "border-primary/30",
        text: "text-primary",
        ring: "ring-primary/40",
        bar: "bg-primary",
        glow: "shadow-primary/20",
      };
    case "growing":
      return {
        label: "Growing",
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        text: "text-amber-400",
        ring: "ring-amber-500/40",
        bar: "bg-amber-500",
        glow: "shadow-amber-500/20",
      };
    case "early":
    default:
      return {
        label: "Early",
        bg: "bg-muted/40",
        border: "border-border",
        text: "text-muted-foreground",
        ring: "ring-border",
        bar: "bg-muted-foreground",
        glow: "",
      };
  }
}

function ScoreRing({ score, tier }: { score: number; tier: MatchResult["tier"] }) {
  const cfg = tierConfig(tier);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className={cn("relative flex size-20 shrink-0 items-center justify-center rounded-full", cfg.bg)}>
      <svg className="absolute size-20 -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth="5" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          className={cfg.text}
        />
      </svg>
      <span className={cn("relative z-10 font-mono text-lg font-bold tabular-nums", cfg.text)}>
        {score}
      </span>
    </div>
  );
}

export default async function MatchPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const matches = await getMatchScores(session.user.id);

  const top3 = matches.filter((m) => m.solved > 0).slice(0, 3);
  const totalSolved = matches.reduce((acc, m) => acc + m.solved, 0);

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="size-5 text-primary" />
                <span className="label-mono">Company Match</span>
              </div>
              <h1 className="text-3xl font-heading font-bold tracking-tight">
                Your Readiness Score
              </h1>
              <p className="text-muted-foreground mt-2 max-w-lg">
                Calculated from your solved problem coverage, difficulty alignment, and algorithm topic overlap with each company's interview patterns.
              </p>
            </div>

            {/* Quick stats */}
            <div className="hidden md:flex flex-col gap-2 shrink-0 text-right">
              <div className="text-3xl font-heading font-bold tabular-nums">{totalSolved}</div>
              <div className="text-sm text-muted-foreground">Total problems solved</div>
            </div>
          </div>

          {/* Top 3 highlight strip */}
          {top3.length > 0 && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {top3.map((m, i) => {
                const cfg = tierConfig(m.tier);
                return (
                  <Link
                    key={m.companyId}
                    href={`/companies/${m.companySlug}`}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-lg",
                      cfg.bg, cfg.border, cfg.glow && `shadow-lg ${cfg.glow}`
                    )}
                  >
                    <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold", cfg.text)}>
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{m.companyName}</div>
                      <div className={cn("text-xs font-mono font-bold", cfg.text)}>{m.score}% ready</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main list */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-4 flex items-center gap-2">
          <span className="label-mono">All companies</span>
          <span className="text-xs text-muted-foreground">({matches.length})</span>
        </div>

        <div className="flex flex-col gap-3">
          {matches.map((match) => {
            const cfg = tierConfig(match.tier);
            return (
              <div
                key={match.companyId}
                className={cn(
                  "group flex items-center gap-5 rounded-xl border bg-card p-5 transition-all duration-200 hover:shadow-md",
                  match.score > 0 && "hover:border-primary/20"
                )}
              >
                {/* Score ring */}
                <ScoreRing score={match.score} tier={match.tier} />

                {/* Info block */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/companies/${match.companySlug}`}
                      className="font-heading font-semibold text-lg hover:text-primary transition-colors"
                    >
                      {match.companyName}
                    </Link>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", cfg.bg, cfg.border, cfg.text)}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700", cfg.bar)}
                        style={{ width: `${match.score}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                      {match.solved} / {match.total}
                    </span>
                  </div>

                  {/* Sub-scores + gap topics */}
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="size-3" />
                      Coverage: <strong className="text-foreground ml-1">{match.coverageScore}%</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="size-3" />
                      Difficulty: <strong className="text-foreground ml-1">{match.difficultyScore}%</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="size-3" />
                      Topics: <strong className="text-foreground ml-1">{match.topicScore}%</strong>
                    </span>
                    {match.topGapTopics.length > 0 && (
                      <span className="text-rose-400/80">
                        Gap: {match.topGapTopics.join(", ")}
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href={`/companies/${match.companySlug}`}
                  className="hidden sm:flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  Practice →
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
