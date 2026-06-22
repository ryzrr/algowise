import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getCompaniesWithProgress,
  getOverallStats,
  getAllCompaniesForPalette,
  getWeeklyDelta,
  getRandomUnsolvedProblem,
  getDueRevisionCount,
} from "@/lib/data";
import { getNearestInterviewTarget } from "@/lib/interview-target";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { CommandPalette } from "@/components/command-palette";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [companies, stats, paletteCompanies, weeklyDelta, randomProblem, dueCount, nearestTarget] =
    await Promise.all([
      getCompaniesWithProgress(session.user.id),
      getOverallStats(session.user.id),
      getAllCompaniesForPalette(),
      getWeeklyDelta(session.user.id),
      getRandomUnsolvedProblem(session.user.id),
      getDueRevisionCount(session.user.id),
      getNearestInterviewTarget(session.user.id),
    ]);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar
        companies={companies}
        streak={stats.streak.currentStreak}
        dueCount={dueCount}
        nearestTarget={nearestTarget}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={session.user}
          streak={stats.streak.currentStreak}
          solvedToday={stats.streak.solvedToday}
          weeklyDelta={weeklyDelta}
          randomProblem={randomProblem}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <CommandPalette companies={paletteCompanies} />
    </div>
  );
}
