import { prisma } from "@/lib/prisma";

export type BlindModeOption = { id: string; name: string };

export type BlindModeProblem = {
  problemId: string;
  title: string;
  link: string;
  difficulty: string;
  options: BlindModeOption[];
  actualCompanyId: string;
};

export async function getRandomBlindProblem(): Promise<BlindModeProblem | null> {
  // Sample a pool of company-problem mappings, similar to getRandomUnsolvedProblem,
  // but with no unsolved restriction — any problem with at least one company mapping is fair game.
  const candidates = await prisma.companyProblem.findMany({
    select: { problemId: true },
    orderBy: { frequency: "desc" },
    take: 200,
  });
  if (candidates.length === 0) return null;

  const distinctProblemIds = Array.from(new Set(candidates.map((c) => c.problemId)));
  const problemId = distinctProblemIds[Math.floor(Math.random() * distinctProblemIds.length)];

  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: {
      companies: {
        include: { company: true },
        orderBy: { frequency: "desc" },
        take: 1,
      },
    },
  });
  if (!problem) return null;

  const actualCompany = problem.companies[0]?.company;
  if (!actualCompany) return null;

  // Pick 5 other random distinct companies as wrong options.
  const wrongPool = await prisma.company.findMany({
    where: { id: { not: actualCompany.id } },
    select: { id: true, name: true },
  });

  const shuffledWrong = [...wrongPool].sort(() => Math.random() - 0.5);
  const wrongOptions = shuffledWrong.slice(0, 5);

  const options: BlindModeOption[] = [
    { id: actualCompany.id, name: actualCompany.name },
    ...wrongOptions.map((c) => ({ id: c.id, name: c.name })),
  ].sort(() => Math.random() - 0.5);

  return {
    problemId: problem.id,
    title: problem.title,
    link: problem.link,
    difficulty: problem.difficulty,
    options,
    actualCompanyId: actualCompany.id,
  };
}

export type BlindModeStats = {
  totalAttempts: number;
  correctCount: number;
  accuracyPct: number;
  perCompany: {
    companyId: string;
    companyName: string;
    attempts: number;
    correct: number;
    accuracyPct: number;
  }[];
};

export async function getBlindModeStats(userId: string): Promise<BlindModeStats> {
  const attempts = await prisma.blindAttempt.findMany({
    where: { userId },
    select: {
      correct: true,
      actualCompanyId: true,
      actualCompany: { select: { id: true, name: true } },
    },
  });

  const totalAttempts = attempts.length;
  const correctCount = attempts.filter((a) => a.correct).length;
  const accuracyPct = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

  const byCompany = new Map<
    string,
    { companyId: string; companyName: string; attempts: number; correct: number }
  >();

  for (const a of attempts) {
    if (!a.actualCompanyId || !a.actualCompany) continue;
    const existing = byCompany.get(a.actualCompanyId);
    if (existing) {
      existing.attempts += 1;
      if (a.correct) existing.correct += 1;
    } else {
      byCompany.set(a.actualCompanyId, {
        companyId: a.actualCompanyId,
        companyName: a.actualCompany.name,
        attempts: 1,
        correct: a.correct ? 1 : 0,
      });
    }
  }

  const perCompany = Array.from(byCompany.values())
    .map((c) => ({
      ...c,
      accuracyPct: c.attempts > 0 ? Math.round((c.correct / c.attempts) * 100) : 0,
    }))
    .sort((a, b) => b.attempts - a.attempts);

  return { totalAttempts, correctCount, accuracyPct, perCompany };
}
