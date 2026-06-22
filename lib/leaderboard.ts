import { prisma } from "@/lib/prisma";

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string | null;
  username: string | null;
  image: string | null;
  solved: number;
};

export type CompanyLeaderboard = {
  company: {
    name: string;
    slug: string;
    problemCount: number;
  };
  entries: LeaderboardEntry[];
  currentUserEntry: { rank: number; solved: number } | null;
};

const LEADERBOARD_SIZE = 50;

export async function getCompanyLeaderboard(
  companySlug: string,
  currentUserId: string
): Promise<CompanyLeaderboard | null> {
  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    select: { id: true, name: true, slug: true, problemCount: true },
  });

  if (!company) return null;

  const companyInfo = { name: company.name, slug: company.slug, problemCount: company.problemCount };

  const companyProblems = await prisma.companyProblem.findMany({
    where: { companyId: company.id },
    select: { problemId: true },
  });

  const problemIds = companyProblems.map((cp) => cp.problemId);

  if (problemIds.length === 0) {
    return {
      company: companyInfo,
      entries: [],
      currentUserEntry: null,
    };
  }

  const grouped = await prisma.userProblemStatus.groupBy({
    by: ["userId"],
    where: { status: "SOLVED", problemId: { in: problemIds } },
    _count: { _all: true },
  });

  // Sort descending by solved count.
  const sorted = [...grouped].sort((a, b) => b._count._all - a._count._all);

  const top = sorted.slice(0, LEADERBOARD_SIZE);
  const topUserIds = top.map((g) => g.userId);

  const users = await prisma.user.findMany({
    where: { id: { in: topUserIds } },
    select: { id: true, name: true, username: true, image: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const entries: LeaderboardEntry[] = top.map((g, idx) => {
    const u = userMap.get(g.userId);
    return {
      rank: idx + 1,
      userId: g.userId,
      name: u?.name ?? null,
      username: u?.username ?? null,
      image: u?.image ?? null,
      solved: g._count._all,
    };
  });

  let currentUserEntry: { rank: number; solved: number } | null = null;

  const inTop = entries.find((e) => e.userId === currentUserId);
  if (inTop) {
    currentUserEntry = { rank: inTop.rank, solved: inTop.solved };
  } else {
    const currentUserSolved = await prisma.userProblemStatus.count({
      where: { userId: currentUserId, status: "SOLVED", problemId: { in: problemIds } },
    });

    if (currentUserSolved > 0) {
      // Count how many distinct users have a strictly higher solved-count.
      const higherCount = sorted.filter(
        (g) => g.userId !== currentUserId && g._count._all > currentUserSolved
      ).length;
      currentUserEntry = { rank: higherCount + 1, solved: currentUserSolved };
    } else {
      currentUserEntry = null;
    }
  }

  return {
    company: companyInfo,
    entries,
    currentUserEntry,
  };
}
