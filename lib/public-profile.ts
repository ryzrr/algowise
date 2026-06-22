import { prisma } from "@/lib/prisma";
import { getOverallStats, getAlgorithmAnalytics, getTopCompaniesTicker } from "@/lib/data";

export async function getPublicProfile(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  const [stats, algoAnalytics, topCompanies, posts] = await Promise.all([
    getOverallStats(user.id),
    getAlgorithmAnalytics(user.id),
    getTopCompaniesTicker(user.id, 5),
    prisma.post.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, slug: true, views: true, createdAt: true },
    }),
  ]);

  return {
    user,
    stats,
    algoAnalytics,
    topCompanies,
    posts,
  };
}

export type PublicProfile = NonNullable<Awaited<ReturnType<typeof getPublicProfile>>>;
