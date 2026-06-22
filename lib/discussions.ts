import { prisma } from "@/lib/prisma";

const authorSelect = {
  select: {
    id: true,
    name: true,
    username: true,
    image: true,
  },
} as const;

export async function getProblemDiscussionPage(problemId: string) {
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

  const threads = await prisma.problemDiscussion.findMany({
    where: { problemId, parentId: null },
    include: {
      author: authorSelect,
      replies: {
        include: { author: authorSelect },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const company = problem.companies[0]?.company ?? null;

  return {
    problem: {
      id: problem.id,
      title: problem.title,
      link: problem.link,
      difficulty: problem.difficulty,
      company: company ? { id: company.id, name: company.name, slug: company.slug } : null,
    },
    threads,
  };
}

export type ProblemDiscussionPage = NonNullable<
  Awaited<ReturnType<typeof getProblemDiscussionPage>>
>;
export type DiscussionThread = ProblemDiscussionPage["threads"][number];
