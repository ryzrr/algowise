import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS, seedAchievements } from "@/lib/achievements";
import { Trophy, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  // Ensure all achievement definitions exist in DB (idempotent upsert)
  await seedAchievements();

  const earned = await prisma.userAchievement.findMany({
    where: { userId: session.user.id },
    select: { achievementId: true, awardedAt: true },
  });

  const earnedMap = new Map(earned.map((e) => [e.achievementId, e.awardedAt]));
  const earnedCount = earned.length;
  const totalCount = ACHIEVEMENTS.length;
  const pct = Math.round((earnedCount / totalCount) * 100);

  const categories = [
    { label: "Solve Milestones", ids: ["first_solve","solve_10","solve_50","solve_100","solve_250","solve_500"] },
    { label: "Difficulty", ids: ["first_hard","hard_10","hard_50"] },
    { label: "Streaks", ids: ["streak_3","streak_7","streak_30","streak_100"] },
    { label: "Companies", ids: ["first_company","five_companies","company_ready","multi_company_ready"] },
    { label: "Community", ids: ["first_post","post_5","first_comment"] },
  ];

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="size-5 text-primary" />
                <span className="label-mono">Achievements</span>
              </div>
              <h1 className="text-3xl font-heading font-bold tracking-tight">Your Badges</h1>
              <p className="text-muted-foreground mt-1">
                {earnedCount} of {totalCount} unlocked
              </p>
            </div>
            {/* Progress ring */}
            <div className="relative flex size-24 shrink-0 items-center justify-center">
              <svg className="absolute size-24 -rotate-90" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth="7" />
                <circle
                  cx="48" cy="48" r="40" fill="none"
                  stroke="currentColor"
                  strokeWidth="7"
                  strokeDasharray={`${(pct / 100) * 2 * Math.PI * 40} ${2 * Math.PI * 40}`}
                  strokeLinecap="round"
                  className="text-primary"
                />
              </svg>
              <div className="relative z-10 text-center">
                <div className="font-mono text-xl font-bold tabular-nums text-primary">{pct}%</div>
                <div className="text-[10px] text-muted-foreground">done</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievement categories */}
      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-10">
        {categories.map((cat) => {
          const catDefs = ACHIEVEMENTS.filter((a) => cat.ids.includes(a.id));
          const catEarned = catDefs.filter((a) => earnedMap.has(a.id)).length;

          return (
            <section key={cat.label}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-lg">{cat.label}</h2>
                <span className="label-mono">{catEarned}/{catDefs.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {catDefs.map((def) => {
                  const awardedAt = earnedMap.get(def.id);
                  const isEarned = !!awardedAt;
                  return (
                    <div
                      key={def.id}
                      className={cn(
                        "flex items-center gap-4 rounded-xl border p-4 transition-all",
                        isEarned
                          ? "border-primary/20 bg-primary/5 shadow-sm shadow-primary/10"
                          : "border-border bg-card opacity-60"
                      )}
                    >
                      <div className={cn(
                        "flex size-14 shrink-0 items-center justify-center rounded-xl text-3xl",
                        isEarned ? "bg-primary/10" : "bg-muted grayscale"
                      )}>
                        {isEarned ? def.emoji : <Lock className="size-5 text-muted-foreground" />}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("font-semibold text-sm", !isEarned && "text-muted-foreground")}>
                            {def.name}
                          </span>
                          {isEarned && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/20 text-primary">
                              Earned
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {def.description}
                        </p>
                        {isEarned && awardedAt && (
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            {format(awardedAt, "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
