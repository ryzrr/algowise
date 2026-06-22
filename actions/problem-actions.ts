"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function toggleSolved(problemId: string, companySlug?: string) {
  const userId = await requireUserId();

  const existing = await prisma.userProblemStatus.findUnique({
    where: { userId_problemId: { userId, problemId } },
  });

  const nowSolved = existing?.status !== "SOLVED";

  await prisma.userProblemStatus.upsert({
    where: { userId_problemId: { userId, problemId } },
    update: {
      status: nowSolved ? "SOLVED" : "TODO",
      solvedAt: nowSolved ? new Date() : null,
    },
    create: {
      userId,
      problemId,
      status: nowSolved ? "SOLVED" : "TODO",
      solvedAt: nowSolved ? new Date() : null,
    },
  });

  // Check and award achievements whenever a problem is solved
  let newAchievements: { id: string; name: string; emoji: string }[] = [];
  if (nowSolved) {
    try {
      const { checkAndAwardAchievements } = await import("@/lib/achievements");
      const earned = await checkAndAwardAchievements(userId);
      newAchievements = earned.map((a) => ({ id: a.id, name: a.name, emoji: a.emoji }));
    } catch {
      // Non-critical — don't block the solve action
    }
  }

  // If this problem happens to be today's Daily Challenge, track completion
  try {
    const { getOrCreateDailyChallenge } = await import("@/lib/daily-challenge");
    const challenge = await getOrCreateDailyChallenge();
    if (challenge && challenge.problemId === problemId) {
      if (nowSolved) {
        await prisma.dailyChallengeCompletion.upsert({
          where: { dailyChallengeId_userId: { dailyChallengeId: challenge.id, userId } },
          update: {},
          create: { dailyChallengeId: challenge.id, userId },
        });
      } else {
        await prisma.dailyChallengeCompletion.deleteMany({
          where: { dailyChallengeId: challenge.id, userId },
        });
      }
    }
  } catch {
    // Non-critical
  }

  // Advance the spaced-repetition schedule for this problem
  if (nowSolved) {
    try {
      const { scheduleNextReview } = await import("@/lib/spaced-repetition");
      await scheduleNextReview(userId, problemId, "solved");
    } catch {
      // Non-critical
    }
  }

  if (companySlug) revalidatePath(`/companies/${companySlug}`);
  revalidatePath("/");
  revalidatePath("/revision");
  revalidatePath("/achievements");
  return { solved: nowSolved, newAchievements };
}


export async function toggleStar(problemId: string, companySlug?: string) {
  const userId = await requireUserId();

  const existing = await prisma.userProblemStatus.findUnique({
    where: { userId_problemId: { userId, problemId } },
  });

  const starred = !existing?.starred;

  await prisma.userProblemStatus.upsert({
    where: { userId_problemId: { userId, problemId } },
    update: { starred },
    create: { userId, problemId, starred },
  });

  if (companySlug) revalidatePath(`/companies/${companySlug}`);
  revalidatePath("/revision");
  return { starred };
}

export async function setNote(
  problemId: string,
  note: string,
  companySlug?: string
) {
  const userId = await requireUserId();

  await prisma.userProblemStatus.upsert({
    where: { userId_problemId: { userId, problemId } },
    update: { note: note || null },
    create: { userId, problemId, note: note || null },
  });

  if (companySlug) revalidatePath(`/companies/${companySlug}`);
}
