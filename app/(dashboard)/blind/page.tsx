import { auth } from "@/lib/auth";
import { getRandomBlindProblem, getBlindModeStats } from "@/lib/blind-mode";
import { BlindModeGame } from "@/components/blind-mode-game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EyeOff } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BlindModePage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [problem, stats] = await Promise.all([
    getRandomBlindProblem(),
    getBlindModeStats(userId),
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Blind Mode</h1>
        <p className="text-muted-foreground">
          The company and difficulty are hidden. Read the problem, guess which company asked it,
          then reveal the answer to see if you were right.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EyeOff className="size-4 text-primary" />
            Your guessing accuracy
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-2xl font-bold tabular-nums">{stats.accuracyPct}%</div>
              <div className="text-xs text-muted-foreground">Overall accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums">{stats.totalAttempts}</div>
              <div className="text-xs text-muted-foreground">Total attempts</div>
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums">{stats.correctCount}</div>
              <div className="text-xs text-muted-foreground">Correct guesses</div>
            </div>
          </div>

          {stats.perCompany.length > 0 && (
            <div className="flex flex-col gap-2 pt-2">
              <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Per-company accuracy
              </div>
              {stats.perCompany.slice(0, 5).map((c) => (
                <div key={c.companyId} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-sm">{c.companyName}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${c.accuracyPct}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                    {c.accuracyPct}% ({c.correct}/{c.attempts})
                  </span>
                </div>
              ))}
            </div>
          )}

          {stats.totalAttempts === 0 && (
            <p className="text-sm text-muted-foreground">
              No attempts yet — make your first guess below to start tracking accuracy.
            </p>
          )}
        </CardContent>
      </Card>

      {problem ? (
        <BlindModeGame problem={problem} />
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No problems with company data are available right now.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
