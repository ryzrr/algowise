import { prisma } from "@/lib/prisma";
import type { ProblemRow } from "@/components/problem-table";

export async function getUserLists(userId: string) {
  const lists = await prisma.list.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { problems: true } },
    },
  });

  return lists.map((list) => ({
    id: list.id,
    name: list.name,
    description: list.description,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
    problemCount: list._count.problems,
  }));
}

export async function getListDetail(listId: string, userId: string) {
  const list = await prisma.list.findUnique({
    where: { id: listId },
    include: {
      problems: {
        orderBy: { addedAt: "desc" },
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

  if (!list || list.userId !== userId) return null;

  const rows: ProblemRow[] = list.problems.map((lp) => ({
    problemId: lp.problem.id,
    title: lp.problem.title,
    link: lp.problem.link,
    difficulty: lp.problem.difficulty,
    isPaidOnly: lp.problem.isPaidOnly,
    status: lp.problem.statuses[0]?.status ?? "TODO",
    starred: lp.problem.statuses[0]?.starred ?? false,
    note: lp.problem.statuses[0]?.note ?? "",
  }));

  return {
    id: list.id,
    name: list.name,
    description: list.description,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
    rows,
  };
}

export async function searchProblemsByTitle(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const candidates = await prisma.problem.findMany({
    select: { id: true, title: true, difficulty: true },
    take: 2000,
  });

  const needle = trimmed.toLowerCase();
  return candidates
    .filter((p) => p.title.toLowerCase().includes(needle))
    .slice(0, 20);
}
