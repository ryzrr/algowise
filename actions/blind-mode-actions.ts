"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function submitBlindGuess(problemId: string, guessedCompanyId: string) {
  const userId = await requireUserId();

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
  if (!problem) throw new Error("Problem not found");

  const actualCompany = problem.companies[0]?.company;
  if (!actualCompany) throw new Error("Problem has no associated company");

  const correct = actualCompany.id === guessedCompanyId;

  await prisma.blindAttempt.create({
    data: {
      userId,
      problemId,
      guessedCompanyId,
      actualCompanyId: actualCompany.id,
      correct,
    },
  });

  revalidatePath("/blind");

  return {
    correct,
    actualCompany: { id: actualCompany.id, name: actualCompany.name },
    difficulty: problem.difficulty,
  };
}
