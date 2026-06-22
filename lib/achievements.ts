/**
 * achievements.ts
 *
 * All achievement definitions live here. Each has:
 * - id:          Stable string key. Never change this once shipped.
 * - name:        Display name
 * - description: Shown in the achievements panel
 * - emoji:       The badge icon
 * - check:       Pure function — given user context, returns true if earned
 */

export type AchievementContext = {
  totalSolved: number;
  solvedEasy: number;
  solvedMedium: number;
  solvedHard: number;
  currentStreak: number;
  longestStreak: number;
  totalPosts: number;
  totalComments: number;
  companiesWithAny: number; // companies with at least 1 solved problem
  companiesAt80pct: number; // companies with >= 80% completion
  topicsAt80pct: number; // algorithm radar topics with >= 80% score
};

export type AchievementDef = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  check: (ctx: AchievementContext) => boolean;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Solve milestones ──────────────────────────────────────────────────
  {
    id: "first_solve",
    name: "First Blood",
    description: "Solve your very first problem.",
    emoji: "⚡",
    check: (ctx) => ctx.totalSolved >= 1,
  },
  {
    id: "solve_10",
    name: "Warming Up",
    description: "Solve 10 problems.",
    emoji: "🌱",
    check: (ctx) => ctx.totalSolved >= 10,
  },
  {
    id: "solve_50",
    name: "50 Strong",
    description: "Solve 50 problems.",
    emoji: "💪",
    check: (ctx) => ctx.totalSolved >= 50,
  },
  {
    id: "solve_100",
    name: "100 Club",
    description: "Solve 100 problems. You're in the top tier.",
    emoji: "💯",
    check: (ctx) => ctx.totalSolved >= 100,
  },
  {
    id: "solve_250",
    name: "Grinder",
    description: "Solve 250 problems.",
    emoji: "⚙️",
    check: (ctx) => ctx.totalSolved >= 250,
  },
  {
    id: "solve_500",
    name: "500 Club",
    description: "Solve 500 problems. Elite territory.",
    emoji: "🏆",
    check: (ctx) => ctx.totalSolved >= 500,
  },

  // ── Difficulty milestones ─────────────────────────────────────────────
  {
    id: "first_hard",
    name: "Hard Boiled",
    description: "Solve your first Hard problem.",
    emoji: "💀",
    check: (ctx) => ctx.solvedHard >= 1,
  },
  {
    id: "hard_10",
    name: "Hard Mode",
    description: "Solve 10 Hard problems.",
    emoji: "🔥",
    check: (ctx) => ctx.solvedHard >= 10,
  },
  {
    id: "hard_50",
    name: "Monster Slayer",
    description: "Solve 50 Hard problems. Respect.",
    emoji: "🐉",
    check: (ctx) => ctx.solvedHard >= 50,
  },

  // ── Streak milestones ─────────────────────────────────────────────────
  {
    id: "streak_3",
    name: "Consistent",
    description: "Maintain a 3-day streak.",
    emoji: "🔁",
    check: (ctx) => ctx.longestStreak >= 3,
  },
  {
    id: "streak_7",
    name: "On Fire",
    description: "Maintain a 7-day streak.",
    emoji: "🔥",
    check: (ctx) => ctx.longestStreak >= 7,
  },
  {
    id: "streak_30",
    name: "Unstoppable",
    description: "Maintain a 30-day streak.",
    emoji: "⚡",
    check: (ctx) => ctx.longestStreak >= 30,
  },
  {
    id: "streak_100",
    name: "Legend",
    description: "Maintain a 100-day streak.",
    emoji: "👑",
    check: (ctx) => ctx.longestStreak >= 100,
  },

  // ── Company milestones ────────────────────────────────────────────────
  {
    id: "first_company",
    name: "Scout",
    description: "Solve at least 1 problem from 1 company.",
    emoji: "🏢",
    check: (ctx) => ctx.companiesWithAny >= 1,
  },
  {
    id: "five_companies",
    name: "Diversified",
    description: "Solve problems from 5 different companies.",
    emoji: "🌍",
    check: (ctx) => ctx.companiesWithAny >= 5,
  },
  {
    id: "globe_trotter",
    name: "Globe Trotter",
    description: "Track problems from 10 different companies.",
    emoji: "🌏",
    check: (ctx) => ctx.companiesWithAny >= 10,
  },
  {
    id: "company_ready",
    name: "Company Ready",
    description: "Reach 80%+ completion on any company.",
    emoji: "🎯",
    check: (ctx) => ctx.companiesAt80pct >= 1,
  },
  {
    id: "multi_company_ready",
    name: "In Demand",
    description: "Reach 80%+ completion on 3 companies.",
    emoji: "🌟",
    check: (ctx) => ctx.companiesAt80pct >= 3,
  },
  {
    id: "algorithm_master",
    name: "Algorithm Master",
    description: "Get 80%+ on 5 algorithm radar chart topics.",
    emoji: "🧠",
    check: (ctx) => ctx.topicsAt80pct >= 5,
  },

  // ── Community milestones ──────────────────────────────────────────────
  {
    id: "first_post",
    name: "Author",
    description: "Publish your first Community post.",
    emoji: "✍️",
    check: (ctx) => ctx.totalPosts >= 1,
  },
  {
    id: "post_5",
    name: "Contributor",
    description: "Publish 5 Community posts.",
    emoji: "📝",
    check: (ctx) => ctx.totalPosts >= 5,
  },
  {
    id: "first_comment",
    name: "Engaged",
    description: "Leave your first comment in the Community.",
    emoji: "💬",
    check: (ctx) => ctx.totalComments >= 1,
  },
  {
    id: "commenter_10",
    name: "Commenter",
    description: "Leave 10 comments on Community posts.",
    emoji: "💬",
    check: (ctx) => ctx.totalComments >= 10,
  },
];

/** Map achievement id -> definition for fast lookups */
export const ACHIEVEMENT_MAP = new Map(
  ACHIEVEMENTS.map((a) => [a.id, a])
);

/**
 * Seed all achievement definitions into the DB.
 * Run this once (or idempotently) when the app boots or via a script.
 */
export async function seedAchievements() {
  const { prisma } = await import("@/lib/prisma");
  await Promise.all(
    ACHIEVEMENTS.map((a) =>
      prisma.achievement.upsert({
        where: { id: a.id },
        update: { name: a.name, description: a.description, emoji: a.emoji },
        create: { id: a.id, name: a.name, description: a.description, emoji: a.emoji },
      })
    )
  );
}

/**
 * Check all achievements for a user and award any newly earned ones.
 * Returns the list of NEWLY awarded achievements (for toast notifications).
 */
export async function checkAndAwardAchievements(
  userId: string
): Promise<AchievementDef[]> {
  const { prisma } = await import("@/lib/prisma");

  // Fetch all data needed to evaluate every achievement
  const [
    solvedStatuses,
    userPosts,
    userComments,
    alreadyEarned,
    companiesProgress,
    solvedProblemTopics,
    allTopicsStats,
  ] = await Promise.all([
    prisma.userProblemStatus.findMany({
      where: { userId, status: "SOLVED" },
      select: {
        problem: { select: { difficulty: true } },
      },
    }),
    prisma.post.count({ where: { authorId: userId } }),
    prisma.comment.count({ where: { authorId: userId } }),
    prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    }),
    // Get per-company progress
    prisma.company.findMany({
      select: {
        problemCount: true,
        problems: {
          select: {
            problem: {
              select: {
                statuses: {
                  where: { userId, status: "SOLVED" },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    }),
    // Per-topic progress (mirrors the radar chart scoring in lib/data.ts's getAlgorithmAnalytics)
    prisma.problemTopic.findMany({
      where: { problem: { statuses: { some: { userId, status: "SOLVED" } } } },
      select: { topicId: true },
    }),
    prisma.topic.findMany({ select: { id: true, _count: { select: { problems: true } } } }),
  ]);

  const earnedIds = new Set(alreadyEarned.map((e) => e.achievementId));

  // Build context
  let easy = 0, medium = 0, hard = 0;
  for (const { problem } of solvedStatuses) {
    if (problem.difficulty === "EASY") easy++;
    else if (problem.difficulty === "MEDIUM") medium++;
    else if (problem.difficulty === "HARD") hard++;
  }

  let companiesWithAny = 0;
  let companiesAt80pct = 0;
  for (const company of companiesProgress) {
    const solved = company.problems.filter((cp) => cp.problem.statuses.length > 0).length;
    if (solved > 0) companiesWithAny++;
    if (company.problemCount > 0 && solved / company.problemCount >= 0.8) companiesAt80pct++;
  }

  const solvedCountByTopicId: Record<string, number> = {};
  for (const pt of solvedProblemTopics) {
    solvedCountByTopicId[pt.topicId] = (solvedCountByTopicId[pt.topicId] ?? 0) + 1;
  }
  let topicsAt80pct = 0;
  for (const topic of allTopicsStats) {
    const total = topic._count.problems;
    if (total === 0) continue;
    const solved = solvedCountByTopicId[topic.id] ?? 0;
    const score = Math.min(100, Math.round((solved / Math.min(total, 50)) * 100));
    if (score >= 80) topicsAt80pct++;
  }

  // We don't have streak here — fetch separately
  const { computeStreak } = await import("@/lib/streak");
  const solvedDates = await prisma.userProblemStatus.findMany({
    where: { userId, status: "SOLVED" },
    select: { solvedAt: true },
  });
  const streakStats = computeStreak(
    solvedDates.map((s) => s.solvedAt).filter((d): d is Date => !!d)
  );

  const ctx: AchievementContext = {
    totalSolved: solvedStatuses.length,
    solvedEasy: easy,
    solvedMedium: medium,
    solvedHard: hard,
    currentStreak: streakStats.currentStreak,
    longestStreak: streakStats.longestStreak,
    totalPosts: userPosts,
    totalComments: userComments,
    companiesWithAny,
    companiesAt80pct,
    topicsAt80pct,
  };

  // Find newly earned
  const newlyEarned: AchievementDef[] = [];
  for (const def of ACHIEVEMENTS) {
    if (!earnedIds.has(def.id) && def.check(ctx)) {
      newlyEarned.push(def);
    }
  }

  // Award them — SQLite's createMany doesn't support skipDuplicates, so upsert individually
  if (newlyEarned.length > 0) {
    await Promise.all(
      newlyEarned.map((a) =>
        prisma.userAchievement.upsert({
          where: { userId_achievementId: { userId, achievementId: a.id } },
          update: {},
          create: { userId, achievementId: a.id, awardedAt: new Date() },
        })
      )
    );
  }

  return newlyEarned;
}
