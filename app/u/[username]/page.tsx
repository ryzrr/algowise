import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Flame, ListChecks, Trophy } from "lucide-react";
import { auth } from "@/lib/auth";
import { getPublicProfile } from "@/lib/public-profile";
import { ActivityHeatmap } from "@/components/activity-heatmap";
import { AlgorithmRadarChart } from "@/components/algorithm-radar-chart";
import { AnimatedNumber } from "@/components/animated-number";
import { LogoMark } from "@/components/icons/logo-mark";
import { ShareProfileButton } from "@/components/share-profile-button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { buttonVariants } from "@/components/ui/button";
import { cn, avatarGradient } from "@/lib/utils";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const [profile, session] = await Promise.all([getPublicProfile(username), auth()]);

  if (!profile) notFound();

  const { user, stats, algoAnalytics, topCompanies, posts } = profile;
  const overallPct = stats.totalProblems > 0 ? (stats.totalSolved / stats.totalProblems) * 100 : 0;
  const displayName = user.name || user.username || "Anonymous";
  const memberSince = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(user.createdAt);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="size-8" />
            <span className="font-heading text-lg font-bold tracking-tight">AlgoWise</span>
          </Link>
          {session?.user ? (
            <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Dashboard
            </Link>
          ) : (
            <Link href="/sign-in" className={cn(buttonVariants({ size: "sm" }))}>
              Sign in
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
        {/* Identity */}
        <div className="flex flex-col items-start gap-4 duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar size="lg" className="size-20">
              <AvatarImage src={user.image ?? undefined} alt={displayName} />
              <AvatarFallback
                className={cn(
                  "bg-gradient-to-br text-2xl font-semibold text-foreground",
                  avatarGradient(displayName)
                )}
              >
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight">{displayName}</h1>
              {user.username && (
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              )}
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="size-3" />
                Member since {memberSince}
              </p>
            </div>
          </div>
          <ShareProfileButton />
        </div>

        {/* Stats row */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="group relative gap-3 overflow-hidden p-5 duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both transition-shadow hover:ring-white/15">
            <span className="absolute top-4 bottom-4 left-0 w-0.5 rounded-r-full bg-primary" />
            <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors">
              <ListChecks className="size-4" />
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
            <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-rose-400 transition-colors">
              <Flame className="size-4" />
              <span className="label-mono">Current streak</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-4xl font-bold tabular-nums">
                <AnimatedNumber value={stats.streak.currentStreak} />
                <span className="text-2xl text-muted-foreground">d</span>
              </span>
            </div>
          </Card>

          <Card className="group gap-3 p-5 delay-150 duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both transition-shadow hover:ring-white/15">
            <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-amber-400 transition-colors">
              <Trophy className="size-4" />
              <span className="label-mono">Longest streak</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-4xl font-bold tabular-nums">
                <AnimatedNumber value={stats.streak.longestStreak} />
                <span className="text-2xl text-muted-foreground">d</span>
              </span>
            </div>
          </Card>
        </div>

        {/* Radar + Top companies */}
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="flex flex-col gap-4 p-5 delay-75 duration-500 animate-in fade-in slide-in-from-bottom-3 fill-mode-both lg:col-span-2">
            <span className="label-mono">Algorithm Mastery</span>
            <div className="h-[260px] w-full">
              <AlgorithmRadarChart data={algoAnalytics} />
            </div>
          </Card>

          <Card className="flex flex-col gap-3 p-5 delay-100 duration-500 animate-in fade-in slide-in-from-bottom-3 fill-mode-both lg:col-span-1">
            <span className="label-mono">Top companies</span>
            <div className="flex flex-col gap-3">
              {topCompanies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No company data yet.</p>
              ) : (
                topCompanies.map((c) => (
                  <div key={c.slug} className="flex items-center gap-3 py-0.5">
                    <span className="w-24 shrink-0 truncate text-sm font-medium">{c.name}</span>
                    <Progress value={c.pct} className="h-1.5 flex-1" />
                    <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                      {c.pct}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Activity heatmap */}
        <Card className="flex flex-col gap-4 p-6 delay-100 duration-500 animate-in fade-in slide-in-from-bottom-3 fill-mode-both">
          <span className="label-mono">Activity · last 52 weeks</span>
          <ActivityHeatmap activityByDay={stats.streak.activityByDay} />
        </Card>

        {/* Recent posts */}
        <Card className="flex flex-col gap-4 p-6 delay-150 duration-500 animate-in fade-in slide-in-from-bottom-3 fill-mode-both">
          <span className="label-mono">Recent posts</span>
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No community posts yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/community/${post.slug}`}
                  className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-primary"
                >
                  <span className="truncate text-sm font-medium">{post.title}</span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {post.views} views ·{" "}
                    {new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
                      post.createdAt
                    )}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
