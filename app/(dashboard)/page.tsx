import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Flame,
  ListChecks,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { auth } from "@/lib/auth";
import {
  getOverallStats,
  getContinueCard,
  getProgressTrend,
  getTopCompaniesTicker,
  getRecentActivity,
  getRevisionList,
  getWeeklyDelta,
  getAlgorithmAnalytics,
} from "@/lib/data";
import { getDailyChallengeWithStats } from "@/lib/daily-challenge";
import { DailyChallengeBanner } from "@/components/daily-challenge-banner";
import { ActivityHeatmap } from "@/components/activity-heatmap";
import { TrendChart } from "@/components/trend-chart";
import { PillBarChart } from "@/components/pill-bar-chart";
import { ActivityTimeline } from "@/components/activity-timeline";
import { ProgressRing } from "@/components/progress-ring";
import { AlgorithmRadarChart } from "@/components/algorithm-radar-chart";
import { AnimatedNumber } from "@/components/animated-number";
import { LottieIcon } from "@/components/lottie-icon";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const days = range === "7" ? 7 : range === "90" ? 90 : 30;

  const session = await auth();
  const userId = session!.user!.id!;

  const [stats, continueCard, trend, topCompanies, recent, revisionList, weeklyDelta, algoAnalytics, dailyChallenge] =
    await Promise.all([
      getOverallStats(userId),
      getContinueCard(userId),
      getProgressTrend(userId, days),
      getTopCompaniesTicker(userId, 5),
      getRecentActivity(userId, 6),
      getRevisionList(userId),
      getWeeklyDelta(userId),
      getAlgorithmAnalytics(userId),
      getDailyChallengeWithStats(userId),
    ]);

  const overallPct =
    stats.totalProblems > 0 ? (stats.totalSolved / stats.totalProblems) * 100 : 0;
  const weekTrendUp = weeklyDelta.deltaPct >= 0;

  const pillItems = (["EASY", "MEDIUM", "HARD"] as const).map((d) => {
    const total = stats.totalByDifficulty[d] ?? 0;
    const solved = stats.solvedByDifficulty[d] ?? 0;
    return {
      label: d === "EASY" ? "Easy" : d === "MEDIUM" ? "Medium" : "Hard",
      solved,
      remaining: total - solved,
      colorClass:
        d === "EASY"
          ? "bg-emerald-400 text-emerald-950"
          : d === "MEDIUM"
            ? "bg-amber-400 text-amber-950"
            : "bg-rose-400 text-rose-950",
    };
  });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
      <div className="duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          <span className="text-foreground">{stats.totalSolved}</span> solved
          <span className="mx-1.5 text-border">/</span>
          <span className="text-foreground">{stats.streak.currentStreak}d</span> streak
          <span className="mx-1.5 text-border">/</span>
          <span className="text-foreground">{revisionList.length}</span> to revise
        </p>
      </div>

      {dailyChallenge && <DailyChallengeBanner challenge={dailyChallenge} />}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative gap-3 overflow-hidden p-5 duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both transition-shadow hover:ring-white/15">
          <span className="absolute top-4 bottom-4 left-0 w-0.5 rounded-r-full bg-primary" />
          <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors">
            <LottieIcon type="checkmark" />
            <span className="label-mono">Total solved</span>
          </div>
          <div className="flex items-baseline gap-2">
            <AnimatedNumber
              value={stats.totalSolved}
              className="font-mono text-4xl font-bold tabular-nums text-primary"
            />
            <span className="text-xs text-muted-foreground">{Math.round(overallPct)}% done</span>
          </div>
        </Card>

        <Card className="group gap-3 p-5 delay-75 duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both transition-shadow hover:ring-white/15">
          <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors">
            <LottieIcon type="calendar" />
            <span className="label-mono">This week</span>
          </div>
          <div className="flex items-baseline gap-2">
            <AnimatedNumber
              value={weeklyDelta.thisWeek}
              className="font-mono text-4xl font-bold tabular-nums"
            />
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-semibold",
                weekTrendUp ? "text-primary" : "text-rose-400"
              )}
            >
              {weekTrendUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {Math.abs(weeklyDelta.deltaPct)}%
            </span>
          </div>
        </Card>

        <Card className="group gap-3 p-5 delay-150 duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both transition-shadow hover:ring-white/15">
          <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-rose-400 transition-colors">
            <LottieIcon type="activity" />
            <span className="label-mono">Streak</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-4xl font-bold tabular-nums">
              <AnimatedNumber value={stats.streak.currentStreak} />
              <span className="text-2xl text-muted-foreground">d</span>
            </span>
            <span className="text-xs text-muted-foreground">best {stats.streak.longestStreak}d</span>
          </div>
        </Card>

        <Link href="/revision" className="delay-200 duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
          <Card className="group h-full gap-3 p-5 transition-all hover:-translate-y-0.5 hover:bg-muted/40 hover:ring-white/15 active:translate-y-0">
            <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-amber-400 transition-colors">
              <LottieIcon type="star" />
              <span className="label-mono">Starred</span>
            </div>
            <div className="flex items-baseline gap-2">
              <AnimatedNumber
                value={revisionList.length}
                className="font-mono text-4xl font-bold tabular-nums"
              />
              <span className="text-xs text-muted-foreground">to revise</span>
            </div>
          </Card>
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="gap-4 p-6 delay-200 duration-500 animate-in fade-in slide-in-from-bottom-3 fill-mode-both lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className="label-mono">Solved over time</span>
            <div className="flex items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5">
              {[7, 30, 90].map((d) => (
                <Link
                  key={d}
                  href={d === 30 ? "/" : `/?range=${d}`}
                  className={cn(
                    "rounded-[5px] px-2.5 py-1 font-mono text-xs font-medium transition-colors",
                    days === d
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {d}D
                </Link>
              ))}
            </div>
          </div>
          <div className="h-44">
            <TrendChart data={trend} height={176} />
          </div>
        </Card>

        <Card className="items-center gap-4 p-6 text-center delay-300 duration-500 animate-in fade-in slide-in-from-bottom-3 fill-mode-both">
          <span className="label-mono self-start">Overall completion</span>
          <ProgressRing
            value={overallPct}
            sublabel={`${stats.totalSolved} / ${stats.totalProblems}`}
            size={132}
          />
          {continueCard ? (
            <Link
              href={`/companies/${continueCard.company.slug}${
                continueCard.nextProblem ? `?focus=${continueCard.nextProblem.id}` : ""
              }`}
              className={cn(buttonVariants(), "w-full gap-1.5")}
            >
              Resume <ArrowRight className="size-4" />
            </Link>
          ) : (
            <Link
              href="/companies"
              className={cn(buttonVariants(), "w-full gap-1.5")}
            >
              Browse companies <ArrowRight className="size-4" />
            </Link>
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="flex flex-col gap-4 p-5 duration-500 animate-in fade-in slide-in-from-bottom-3 fill-mode-both lg:col-span-1">
          <span className="label-mono">Recent activity</span>
          <ActivityTimeline items={recent} />
        </Card>

        <Card className="flex flex-col gap-4 p-5 delay-75 duration-500 animate-in fade-in slide-in-from-bottom-3 fill-mode-both lg:col-span-1">
          <span className="label-mono">Algorithm Mastery</span>
          <div className="h-[220px] w-full">
            <AlgorithmRadarChart data={algoAnalytics} />
          </div>
        </Card>

        <Card className="flex flex-col gap-4 p-5 delay-100 duration-500 animate-in fade-in slide-in-from-bottom-3 fill-mode-both lg:col-span-1">
          <span className="label-mono">Difficulty breakdown</span>
          <PillBarChart items={pillItems} />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="flex flex-col gap-3 p-5 duration-500 animate-in fade-in slide-in-from-bottom-3 fill-mode-both lg:col-span-1">
          <span className="label-mono">Top companies</span>
          <div className="flex flex-col gap-3">
            {topCompanies.map((c)=> (
              <Link
                key={c.slug}
                href={`/companies/${c.slug}`}
                className="group flex items-center gap-3 rounded-md py-0.5 transition-transform hover:translate-x-0.5"
              >
                <span className="w-24 shrink-0 truncate text-sm font-medium transition-colors group-hover:text-primary">
                  {c.name}
                </span>
                <Progress value={c.pct} className="h-1.5 flex-1" />
                <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {c.pct}%
                </span>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-4 p-6 delay-100 duration-500 animate-in fade-in slide-in-from-bottom-3 fill-mode-both lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className="label-mono">Activity · last 52 weeks</span>
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm">
              {stats.streak.longestStreak >= stats.streak.currentStreak ? (
                <TrendingUp className="size-4 text-primary" />
              ) : (
                <TrendingDown className="size-4 text-rose-400" />
              )}
              Longest streak:{" "}
              <span className="font-mono font-semibold tabular-nums">{stats.streak.longestStreak}d</span>
            </div>
          </div>
          <ActivityHeatmap activityByDay={stats.streak.activityByDay} />
        </Card>
      </div>
    </div>
  );
}
