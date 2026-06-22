import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Crown, Medal, Trophy } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCompanyLeaderboard } from "@/lib/leaderboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn, avatarGradient } from "@/lib/utils";

function displayName(entry: { name: string | null; username: string | null }) {
  return entry.name ?? entry.username ?? "Anonymous";
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-amber-400">
        <Crown className="size-5" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-400/15 text-slate-400">
        <Medal className="size-5" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-400/15 text-orange-400">
        <Medal className="size-5" />
      </div>
    );
  }
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold tabular-nums text-muted-foreground">
      {rank}
    </div>
  );
}

export default async function CompanyLeaderboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const userId = session!.user!.id!;

  const leaderboard = await getCompanyLeaderboard(slug, userId);
  if (!leaderboard) notFound();

  const { company, entries, currentUserEntry } = leaderboard;
  const isCurrentUserVisible = entries.some((e) => e.userId === userId);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div className="duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
        <Link
          href={`/companies/${company.slug}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to {company.name}
        </Link>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {company.name} Leaderboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ranked by problems solved out of {company.problemCount} total. Climb the ranks by
          solving more.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-16 text-center">
          <Trophy className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No one has solved a problem from this company yet — be the first!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => {
            const isCurrentUser = entry.userId === userId;
            const name = displayName(entry);
            const pct =
              company.problemCount > 0
                ? Math.min(100, Math.round((entry.solved / company.problemCount) * 100))
                : 0;

            return (
              <div
                key={entry.userId}
                className={cn(
                  "flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors",
                  isCurrentUser && "bg-primary/10 ring-2 ring-primary"
                )}
              >
                <RankBadge rank={entry.rank} />

                <Avatar size="default" className="shrink-0">
                  {entry.image && <AvatarImage src={entry.image} alt={name} />}
                  <AvatarFallback
                    className={cn("bg-gradient-to-br font-medium", avatarGradient(name))}
                  >
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{name}</span>
                    {isCurrentUser && (
                      <span className="shrink-0 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        You
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Progress value={pct} className="h-1.5 flex-1" />
                    <span className="shrink-0 text-[11px] text-muted-foreground">{pct}%</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="font-mono text-lg font-bold tabular-nums">{entry.solved}</div>
                  <div className="text-[11px] text-muted-foreground">solved</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {currentUserEntry && !isCurrentUserVisible && (
        <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 p-4 shadow-lg ring-2 ring-primary">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold tabular-nums text-primary">
              {currentUserEntry.rank}
            </div>
            <span className="text-sm font-medium">Your rank: #{currentUserEntry.rank}</span>
          </div>
          <span className="font-mono text-sm font-bold tabular-nums text-primary">
            {currentUserEntry.solved} solved
          </span>
        </div>
      )}
    </div>
  );
}
