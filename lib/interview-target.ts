import { prisma } from "@/lib/prisma";

async function buildTargetView(userId: string, companyId: string, companySlug: string, companyName: string, problemCount: number, targetDate: Date) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [solved, solvedLast7] = await Promise.all([
    prisma.userProblemStatus.count({
      where: { userId, status: "SOLVED", problem: { companies: { some: { companyId } } } },
    }),
    prisma.userProblemStatus.count({
      where: {
        userId,
        status: "SOLVED",
        solvedAt: { gte: weekAgo },
        problem: { companies: { some: { companyId } } },
      },
    }),
  ]);

  const goal = Math.ceil(problemCount * 0.8);
  const remaining = Math.max(0, goal - solved);
  const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / 86400000));
  const requiredPace = daysRemaining > 0 ? Math.round((remaining / daysRemaining) * 10) / 10 : remaining;
  const currentPace = Math.round((solvedLast7 / 7) * 10) / 10;

  return {
    companyName,
    companySlug,
    targetDate: targetDate.toISOString(),
    daysRemaining,
    solved,
    total: problemCount,
    goal,
    remaining,
    requiredPace,
    currentPace,
    onPace: currentPace >= requiredPace,
  };
}

export async function getInterviewTarget(userId: string, companySlug: string) {
  const company = await prisma.company.findUnique({ where: { slug: companySlug } });
  if (!company) return null;

  const target = await prisma.interviewTarget.findUnique({
    where: { userId_companyId: { userId, companyId: company.id } },
  });
  if (!target) return null;

  return buildTargetView(userId, company.id, company.slug, company.name, company.problemCount, target.targetDate);
}

export async function getNearestInterviewTarget(userId: string) {
  const target = await prisma.interviewTarget.findFirst({
    where: { userId, targetDate: { gte: new Date() } },
    orderBy: { targetDate: "asc" },
    include: { company: true },
  });
  if (!target) return null;

  return buildTargetView(
    userId,
    target.company.id,
    target.company.slug,
    target.company.name,
    target.company.problemCount,
    target.targetDate
  );
}
