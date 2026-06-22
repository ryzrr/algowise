import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

export function getUTCDateOnly(d: Date = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

const dailyChallengeInclude = {
  problem: {
    include: {
      companies: {
        include: { company: true },
        orderBy: { frequency: "desc" as const },
        take: 1,
      },
    },
  },
};

/**
 * Deterministically picks today's problem from frequently-asked problems,
 * seeded by the UTC date string — every user sees the same problem, and it
 * "just works" on first page load each day without a cron job.
 */
export async function getOrCreateDailyChallenge() {
  const date = getUTCDateOnly();

  const existing = await prisma.dailyChallenge.findUnique({
    where: { date },
    include: dailyChallengeInclude,
  });
  if (existing) return existing;

  const candidates = await prisma.companyProblem.findMany({
    select: { problemId: true },
    orderBy: { frequency: "desc" },
    take: 300,
    distinct: ["problemId"],
  });
  if (candidates.length === 0) return null;

  const seed = djb2Hash(date.toISOString().slice(0, 10));
  const pick = candidates[seed % candidates.length];

  try {
    return await prisma.dailyChallenge.create({
      data: { date, problemId: pick.problemId },
      include: dailyChallengeInclude,
    });
  } catch (err) {
    // Another concurrent request created it first — just re-fetch.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return prisma.dailyChallenge.findUnique({
        where: { date },
        include: dailyChallengeInclude,
      });
    }
    throw err;
  }
}

export async function getDailyChallengeWithStats(userId: string) {
  const challenge = await getOrCreateDailyChallenge();
  if (!challenge) return null;

  const [solvedCount, userCompletion] = await Promise.all([
    prisma.dailyChallengeCompletion.count({ where: { dailyChallengeId: challenge.id } }),
    prisma.dailyChallengeCompletion.findUnique({
      where: { dailyChallengeId_userId: { dailyChallengeId: challenge.id, userId } },
    }),
  ]);

  return {
    id: challenge.id,
    date: challenge.date,
    problemId: challenge.problemId,
    title: challenge.problem.title,
    link: challenge.problem.link,
    difficulty: challenge.problem.difficulty,
    company: challenge.problem.companies[0]?.company ?? null,
    solvedCount,
    completedByUser: !!userCompletion,
  };
}
