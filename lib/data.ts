import { prisma } from "@/lib/prisma";
import { computeStreak } from "@/lib/streak";

export async function getCompaniesWithProgress(userId: string) {
  const companies = await prisma.company.findMany({
    orderBy: { problemCount: "desc" },
    include: {
      problems: {
        select: {
          problem: {
            select: {
              statuses: {
                where: { userId },
                select: { status: true },
              },
            },
          },
        },
      },
    },
  });

  return companies.map((c) => {
    const solved = c.problems.filter(
      (cp) => cp.problem.statuses[0]?.status === "SOLVED"
    ).length;
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      problemCount: c.problemCount,
      solved,
    };
  });
}

export async function getOverallStats(userId: string) {
  const [totalProblems, byDifficulty, solvedStatuses] = await Promise.all([
    prisma.problem.count(),
    prisma.problem.groupBy({
      by: ["difficulty"],
      _count: { _all: true },
    }),
    prisma.userProblemStatus.findMany({
      where: { userId, status: "SOLVED" },
      select: { solvedAt: true, problem: { select: { difficulty: true } } },
    }),
  ]);

  const totalByDifficulty: Record<string, number> = {};
  for (const row of byDifficulty) {
    totalByDifficulty[row.difficulty] = row._count._all;
  }

  const solvedByDifficulty: Record<string, number> = {};
  for (const s of solvedStatuses) {
    solvedByDifficulty[s.problem.difficulty] =
      (solvedByDifficulty[s.problem.difficulty] ?? 0) + 1;
  }

  const streak = computeStreak(
    solvedStatuses.map((s) => s.solvedAt).filter((d): d is Date => !!d)
  );

  return {
    totalProblems,
    totalSolved: solvedStatuses.length,
    totalByDifficulty,
    solvedByDifficulty,
    streak,
  };
}

export async function getContinueCard(userId: string) {
  const last = await prisma.userProblemStatus.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      problem: {
        include: {
          companies: {
            include: { company: true },
            orderBy: { frequency: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  const company = last?.problem.companies[0]?.company;
  if (!company) return null;

  const nextUnsolved = await prisma.companyProblem.findFirst({
    where: {
      companyId: company.id,
      problem: { statuses: { none: { userId, status: "SOLVED" } } },
    },
    orderBy: { frequency: "desc" },
    include: { problem: true },
  });

  return {
    company,
    nextProblem: nextUnsolved?.problem ?? null,
  };
}

export async function getCompanyDetail(slug: string, userId: string) {
  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      problems: {
        orderBy: { frequency: "desc" },
        include: {
          problem: {
            include: {
              statuses: { where: { userId } },
            },
          },
        },
      },
    },
  });

  if (!company) return null;

  const rows = company.problems.map((cp) => ({
    problemId: cp.problem.id,
    title: cp.problem.title,
    link: cp.problem.link,
    difficulty: cp.problem.difficulty,
    frequency: cp.frequency,
    isPaidOnly: cp.problem.isPaidOnly,
    status: cp.problem.statuses[0]?.status ?? "TODO",
    starred: cp.problem.statuses[0]?.starred ?? false,
    note: cp.problem.statuses[0]?.note ?? "",
  }));

  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    rows,
  };
}

export async function getRevisionList(userId: string) {
  const starred = await prisma.userProblemStatus.findMany({
    where: { userId, starred: true },
    include: {
      problem: {
        include: {
          companies: {
            include: { company: true },
            orderBy: { frequency: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  const now = Date.now();
  return starred
    .map((s) => ({
      problemId: s.problem.id,
      title: s.problem.title,
      link: s.problem.link,
      difficulty: s.problem.difficulty,
      status: s.status,
      note: s.note ?? "",
      company: s.problem.companies[0]?.company ?? null,
      nextReviewAt: s.nextReviewAt,
      reviewStage: s.reviewStage,
      due: !!s.nextReviewAt && s.nextReviewAt.getTime() <= now,
    }))
    .sort((a, b) => {
      // Due items first, then soonest-due, then items with no schedule yet
      if (!a.nextReviewAt && !b.nextReviewAt) return 0;
      if (!a.nextReviewAt) return 1;
      if (!b.nextReviewAt) return -1;
      return a.nextReviewAt.getTime() - b.nextReviewAt.getTime();
    });
}

export async function getDueRevisionCount(userId: string) {
  return prisma.userProblemStatus.count({
    where: { userId, starred: true, nextReviewAt: { lte: new Date() } },
  });
}

export async function getAllCompaniesForPalette() {
  return prisma.company.findMany({
    select: { name: true, slug: true, problemCount: true },
    orderBy: { problemCount: "desc" },
  });
}

function getLocalYYYYMMDD(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getProgressTrend(userId: string, days = 30) {
  const solved = await prisma.userProblemStatus.findMany({
    where: { userId, status: "SOLVED", solvedAt: { not: null } },
    select: { solvedAt: true },
    orderBy: { solvedAt: "asc" },
  });
  
  // Convert DB UTC dates to Local YYYY-MM-DD strings
  const dateKeys = solved.map((s) => getLocalYYYYMMDD(s.solvedAt!));
  dateKeys.sort(); // Sort again because local dates might cross midnight boundaries differently

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  const startKey = getLocalYYYYMMDD(start);

  let idx = 0;
  let baseline = 0;
  while (idx < dateKeys.length && dateKeys[idx] < startKey) {
    baseline++;
    idx++;
  }

  const result: { date: string; total: number }[] = [];
  let running = baseline;
  const cursor = new Date(start);
  
  while (cursor <= today) {
    const key = getLocalYYYYMMDD(cursor);
    while (idx < dateKeys.length && dateKeys[idx] === key) {
      running++;
      idx++;
    }
    result.push({ date: key, total: running });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export async function getWeeklyDelta(userId: string) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [thisWeek, lastWeek] = await Promise.all([
    prisma.userProblemStatus.count({
      where: { userId, status: "SOLVED", solvedAt: { gte: weekAgo } },
    }),
    prisma.userProblemStatus.count({
      where: { userId, status: "SOLVED", solvedAt: { gte: twoWeeksAgo, lt: weekAgo } },
    }),
  ]);

  const deltaPct =
    lastWeek > 0
      ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
      : thisWeek > 0
        ? 100
        : 0;

  return { thisWeek, lastWeek, deltaPct };
}

export async function getTopCompaniesTicker(userId: string, take = 5) {
  const companies = await prisma.company.findMany({
    orderBy: { problemCount: "desc" },
    take,
    include: {
      problems: {
        select: {
          problem: { select: { statuses: { where: { userId }, select: { status: true } } } },
        },
      },
    },
  });

  return companies.map((c) => {
    const solved = c.problems.filter((cp) => cp.problem.statuses[0]?.status === "SOLVED").length;
    return {
      slug: c.slug,
      name: c.name,
      problemCount: c.problemCount,
      solved,
      pct: c.problemCount > 0 ? Math.round((solved / c.problemCount) * 100) : 0,
    };
  });
}

export async function getRecentActivity(userId: string, take = 5) {
  const recent = await prisma.userProblemStatus.findMany({
    where: { userId, status: "SOLVED" },
    orderBy: { solvedAt: "desc" },
    take,
    include: {
      problem: {
        include: {
          companies: { include: { company: true }, orderBy: { frequency: "desc" }, take: 1 },
        },
      },
    },
  });

  return recent.map((r) => ({
    title: r.problem.title,
    difficulty: r.problem.difficulty,
    solvedAt: r.solvedAt!,
    company: r.problem.companies[0]?.company.name ?? null,
    frequency: r.problem.companies[0]?.frequency ?? 1,
  }));
}

export async function getRandomUnsolvedProblem(userId: string) {
  const candidates = await prisma.companyProblem.findMany({
    where: { problem: { statuses: { none: { userId, status: "SOLVED" } } } },
    select: { companyId: true, company: { select: { slug: true, name: true } }, problemId: true },
    orderBy: { frequency: "desc" },
    take: 200,
  });
  if (candidates.length === 0) return null;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return { companySlug: pick.company.slug, companyName: pick.company.name, problemId: pick.problemId };
}

export async function getAlgorithmAnalytics(userId: string) {
  // Fetch solved topics efficiently
  const solvedProblemTopics = await prisma.problemTopic.findMany({
    where: {
      problem: {
        statuses: {
          some: { userId, status: "SOLVED" }
        }
      }
    },
    select: { topicId: true }
  });

  const solvedCountByTopicId: Record<string, number> = {};
  for (const pt of solvedProblemTopics) {
    solvedCountByTopicId[pt.topicId] = (solvedCountByTopicId[pt.topicId] ?? 0) + 1;
  }

  // Fetch all topics and their total problem counts
  const allTopicsStats = await prisma.topic.findMany({
    select: {
      id: true,
      name: true,
      _count: { select: { problems: true } }
    }
  });

  // Define the core algorithms we want to track on the radar chart
  const CORE_TOPICS = [
    "Array", "String", "Hash Table", "Dynamic Programming", 
    "Two Pointers", "Tree", "Graph", "Trie", "Binary Search",
    "Greedy", "Backtracking", "Heap (Priority Queue)", "Sliding Window"
  ];

  const data = allTopicsStats
    .filter(t => CORE_TOPICS.includes(t.name))
    .map(t => {
      const total = t._count.problems;
      const solved = solvedCountByTopicId[t.id] ?? 0;
      
      return {
        topic: t.name,
        total,
        solved,
        // We calculate a 'score' which is a smoothed percentage so the radar chart 
        // doesn't look totally empty if they've only solved a few problems.
        // It's out of 100 max.
        score: Math.min(100, Math.round((solved / Math.min(total, 50)) * 100))
      };
    })
    .sort((a, b) => b.total - a.total);

  // Return top 8 topics by total frequency to make a nice balanced octagon radar
  return data.slice(0, 8);
}

export async function getMatchScores(userId: string) {
  // Single parallel fetch — all data in 3 queries, no N+1
  const [companies, userSolved, allTopics] = await Promise.all([
    // All companies with their full problem roster + topic info
    prisma.company.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        problemCount: true,
        problems: {
          select: {
            problem: {
              select: {
                id: true,
                difficulty: true,
                topics: { select: { topicId: true } },
              },
            },
          },
        },
      },
    }),

    // The user's solved problems with difficulty + topic info
    prisma.userProblemStatus.findMany({
      where: { userId, status: "SOLVED" },
      select: {
        problem: {
          select: {
            id: true,
            difficulty: true,
            topics: { select: { topicId: true } },
            companies: { select: { companyId: true } },
          },
        },
      },
    }),

    // Topic id -> name lookup
    prisma.topic.findMany({ select: { id: true, name: true } }),
  ]);

  // Build user data structures
  const topicIdToName = new Map(allTopics.map((t) => [t.id, t.name]));
  const userDiffDist = { EASY: 0, MEDIUM: 0, HARD: 0, total: 0 };
  const userTopicVector: Record<string, number> = {};
  const solvedByCompany = new Map<string, number>();

  for (const { problem } of userSolved) {
    const d = problem.difficulty as "EASY" | "MEDIUM" | "HARD" | "UNKNOWN";
    if (d === "EASY" || d === "MEDIUM" || d === "HARD") {
      userDiffDist[d]++;
      userDiffDist.total++;
    }
    for (const { topicId } of problem.topics) {
      userTopicVector[topicId] = (userTopicVector[topicId] ?? 0) + 1;
    }
    for (const { companyId } of problem.companies) {
      solvedByCompany.set(companyId, (solvedByCompany.get(companyId) ?? 0) + 1);
    }
  }

  // Build per-company data structures
  const { computeMatchScores } = await import("@/lib/match");

  const rawCompanies = companies.map((company) => {
    const compDiffDist = { EASY: 0, MEDIUM: 0, HARD: 0, total: 0 };
    const compTopicVector: Record<string, number> = {};

    for (const { problem } of company.problems) {
      const d = problem.difficulty as "EASY" | "MEDIUM" | "HARD" | "UNKNOWN";
      if (d === "EASY" || d === "MEDIUM" || d === "HARD") {
        compDiffDist[d]++;
        compDiffDist.total++;
      }
      for (const { topicId } of problem.topics) {
        compTopicVector[topicId] = (compTopicVector[topicId] ?? 0) + 1;
      }
    }

    return {
      companyId: company.id,
      companyName: company.name,
      companySlug: company.slug,
      totalProblems: company.problemCount,
      difficultyDist: compDiffDist,
      topicVector: compTopicVector,
    };
  });

  const rawUser = {
    solvedProblemIds: new Set(userSolved.map((s) => s.problem.id)),
    solvedByCompany,
    difficultyDist: userDiffDist,
    topicVector: userTopicVector,
  };

  return computeMatchScores(rawCompanies, rawUser, topicIdToName);
}

