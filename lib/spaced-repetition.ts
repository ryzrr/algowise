import { prisma } from "@/lib/prisma";

/**
 * Ebbinghaus forgetting-curve intervals (in days), keyed by problem difficulty.
 * Index = review stage. Beyond the table, the last interval keeps doubling.
 */
export const REVIEW_INTERVALS: Record<string, number[]> = {
  EASY: [3],
  MEDIUM: [1, 7, 21],
  HARD: [1, 3, 14, 30],
  UNKNOWN: [2, 7, 21],
};

function intervalForStage(difficulty: string, stage: number): number {
  const seq = REVIEW_INTERVALS[difficulty] ?? REVIEW_INTERVALS.UNKNOWN;
  if (stage < seq.length) return seq[stage];
  const extra = stage - seq.length + 1;
  return seq[seq.length - 1] * Math.pow(2, extra);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export type ReviewOutcome = "solved" | "easy" | "struggled";

/**
 * Advances a problem's spaced-repetition schedule.
 * - "solved": first time through — schedule the first interval for its difficulty.
 * - "easy": reviewed and recalled with no trouble — double the last interval, advance a stage.
 * - "struggled": reviewed but had to re-learn — reset to stage 0.
 */
export async function scheduleNextReview(
  userId: string,
  problemId: string,
  outcome: ReviewOutcome
) {
  const status = await prisma.userProblemStatus.findUnique({
    where: { userId_problemId: { userId, problemId } },
    include: { problem: { select: { difficulty: true } } },
  });
  if (!status) return;

  const difficulty = status.problem.difficulty;
  let nextStage: number;
  let intervalDays: number;

  if (outcome === "struggled") {
    nextStage = 0;
    intervalDays = intervalForStage(difficulty, 0);
  } else if (outcome === "easy") {
    const currentInterval = intervalForStage(difficulty, status.reviewStage);
    nextStage = status.reviewStage + 1;
    intervalDays = currentInterval * 2;
  } else {
    nextStage = 0;
    intervalDays = intervalForStage(difficulty, 0);
  }

  await prisma.userProblemStatus.update({
    where: { userId_problemId: { userId, problemId } },
    data: {
      reviewStage: nextStage,
      nextReviewAt: addDays(new Date(), intervalDays),
    },
  });
}
