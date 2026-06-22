import { prisma } from "@/lib/prisma";
import type { ProblemRow } from "@/components/problem-table";

export type StoryDifficulty = "EASY" | "MEDIUM" | "HARD";

export type StageConfig = {
  name: string;
  problemCount: number;
  difficulties: StoryDifficulty[];
  timeLimitMinutes: number;
};

// The 4-stage narrative arc for every Story Mode run, regardless of company.
export const STAGES: StageConfig[] = [
  {
    name: "Recruiter Screen",
    problemCount: 2,
    difficulties: ["EASY"],
    timeLimitMinutes: 15,
  },
  {
    name: "Phone Screen",
    problemCount: 1,
    difficulties: ["MEDIUM"],
    timeLimitMinutes: 30,
  },
  {
    name: "Onsite Round 1",
    problemCount: 2,
    difficulties: ["EASY", "MEDIUM", "HARD"],
    timeLimitMinutes: 45,
  },
  {
    name: "Onsite Round 2",
    problemCount: 1,
    difficulties: ["HARD"],
    timeLimitMinutes: 45,
  },
];

type StageDataStage = {
  name: string;
  problemIds: string[];
  startedAt: string | null;
};

type StageData = {
  stages: StageDataStage[];
};

export type StoryStageProblemSource = {
  id: string;
  difficulty: string;
};

/**
 * Picks `count` distinct problem ids from `pool` matching one of `difficulties`,
 * excluding anything already in `used`. Falls back to ANY difficulty within the
 * pool if there aren't enough matching problems left — better to start a
 * slightly-imperfect run than to crash because a company's roster is thin on a
 * particular difficulty.
 */
function pickProblemsForStage(
  pool: StoryStageProblemSource[],
  difficulties: StoryDifficulty[],
  count: number,
  used: Set<string>
): string[] {
  const available = pool.filter((p) => !used.has(p.id));

  let candidates = available.filter((p) =>
    difficulties.includes(p.difficulty as StoryDifficulty)
  );

  // Fallback: not enough distinct problems matching the difficulty filter —
  // relax to ANY difficulty from the remaining pool so the run can still start.
  if (candidates.length < count) {
    candidates = available;
  }

  // Shuffle (Fisher-Yates) and take the first `count`.
  const shuffled = [...candidates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const picked = shuffled.slice(0, count).map((p) => p.id);
  for (const id of picked) used.add(id);
  return picked;
}

export async function startStorySession(companySlug: string, userId: string) {
  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    include: {
      problems: {
        include: { problem: { select: { id: true, difficulty: true } } },
      },
    },
  });

  if (!company) throw new Error("Company not found");

  const pool: StoryStageProblemSource[] = company.problems.map((cp) => ({
    id: cp.problem.id,
    difficulty: cp.problem.difficulty,
  }));

  const used = new Set<string>();
  const stages: StageDataStage[] = STAGES.map((stage, idx) => {
    const problemIds = pickProblemsForStage(
      pool,
      stage.difficulties,
      stage.problemCount,
      used
    );
    return {
      name: stage.name,
      problemIds,
      // The clock starts the moment the run begins — stage 1 only.
      startedAt: idx === 0 ? new Date().toISOString() : null,
    };
  });

  const stageData: StageData = { stages };

  const session = await prisma.storyModeSession.create({
    data: {
      userId,
      companySlug,
      stage: 1,
      status: "IN_PROGRESS",
      stageData: JSON.stringify(stageData),
    },
  });

  return session.id;
}

export type StorySessionView = {
  sessionId: string;
  companySlug: string;
  companyName: string;
  status: "IN_PROGRESS" | "PASSED" | "FAILED";
  stageIndex: number; // 0-based
  stageNumber: number; // 1-based
  totalStages: number;
  stageName: string;
  timeLimitMinutes: number;
  startedAt: string | null;
  weakTopic: string | null;
  rows: ProblemRow[];
  allStages: { name: string; problemCount: number }[];
};

async function buildSessionView(
  session: {
    id: string;
    companySlug: string;
    stage: number;
    status: "IN_PROGRESS" | "PASSED" | "FAILED";
    stageData: string;
    weakTopic: string | null;
  },
  userId: string
): Promise<StorySessionView> {
  const stageData: StageData = JSON.parse(session.stageData);
  const stageIndex = session.stage - 1;
  const currentStage = stageData.stages[stageIndex];

  const company = await prisma.company.findUnique({
    where: { slug: session.companySlug },
    select: { name: true },
  });

  const problemIds = currentStage?.problemIds ?? [];
  const problems = await prisma.problem.findMany({
    where: { id: { in: problemIds } },
    include: { statuses: { where: { userId } } },
  });

  const problemById = new Map(problems.map((p) => [p.id, p]));

  const rows: ProblemRow[] = problemIds
    .map((id) => problemById.get(id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({
      problemId: p.id,
      title: p.title,
      link: p.link,
      difficulty: p.difficulty,
      isPaidOnly: p.isPaidOnly,
      status: p.statuses[0]?.status ?? "TODO",
      starred: p.statuses[0]?.starred ?? false,
      note: p.statuses[0]?.note ?? "",
    }));

  const stageConfig = STAGES[stageIndex];

  return {
    sessionId: session.id,
    companySlug: session.companySlug,
    companyName: company?.name ?? session.companySlug,
    status: session.status,
    stageIndex,
    stageNumber: session.stage,
    totalStages: STAGES.length,
    stageName: stageConfig?.name ?? currentStage?.name ?? "",
    timeLimitMinutes: stageConfig?.timeLimitMinutes ?? 0,
    startedAt: currentStage?.startedAt ?? null,
    weakTopic: session.weakTopic,
    rows,
    allStages: stageData.stages.map((s, i) => ({
      name: s.name,
      problemCount: STAGES[i]?.problemCount ?? s.problemIds.length,
    })),
  };
}

export async function getStorySession(
  sessionId: string,
  userId: string
): Promise<StorySessionView | null> {
  const session = await prisma.storyModeSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.userId !== userId) return null;

  return buildSessionView(session, userId);
}

export async function evaluateCurrentStage(
  sessionId: string,
  userId: string
): Promise<StorySessionView | null> {
  const session = await prisma.storyModeSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.userId !== userId) return null;

  // Already finished — nothing to evaluate, just return the current view.
  if (session.status !== "IN_PROGRESS") {
    return buildSessionView(session, userId);
  }

  const stageData: StageData = JSON.parse(session.stageData);
  const stageIndex = session.stage - 1;
  const currentStage = stageData.stages[stageIndex];
  const stageConfig = STAGES[stageIndex];

  const problemIds = currentStage?.problemIds ?? [];
  const statuses = await prisma.userProblemStatus.findMany({
    where: { userId, problemId: { in: problemIds } },
    select: { problemId: true, status: true },
  });
  const solvedSet = new Set(
    statuses.filter((s) => s.status === "SOLVED").map((s) => s.problemId)
  );

  const allSolved =
    problemIds.length > 0 && problemIds.every((id) => solvedSet.has(id));

  const startedAt = currentStage?.startedAt;
  const timeLimitMinutes = stageConfig?.timeLimitMinutes ?? 0;
  const timedOut =
    !!startedAt &&
    Date.now() - new Date(startedAt).getTime() > timeLimitMinutes * 60 * 1000;

  if (allSolved) {
    // Be lenient: finishing all problems passes the stage even if the clock
    // technically ran out, as long as they got there.
    const isLastStage = stageIndex === stageData.stages.length - 1;

    if (isLastStage) {
      await prisma.storyModeSession.update({
        where: { id: sessionId },
        data: { status: "PASSED", stageData: JSON.stringify(stageData) },
      });
    } else {
      stageData.stages[stageIndex + 1].startedAt = new Date().toISOString();
      await prisma.storyModeSession.update({
        where: { id: sessionId },
        data: {
          stage: session.stage + 1,
          status: "IN_PROGRESS",
          stageData: JSON.stringify(stageData),
        },
      });
    }
  } else if (timedOut) {
    const weakTopic = await computeWeakTopic(stageData, userId);
    await prisma.storyModeSession.update({
      where: { id: sessionId },
      data: { status: "FAILED", weakTopic, stageData: JSON.stringify(stageData) },
    });
  }
  // else: still in progress, not timed out, not all solved — no DB change.

  const refreshed = await prisma.storyModeSession.findUnique({
    where: { id: sessionId },
  });
  if (!refreshed) return null;
  return buildSessionView(refreshed, userId);
}

/**
 * Across every problem assigned in the whole run so far, find the Topic with
 * the most problems that are STILL NOT solved by this user. Falls back to
 * null if no topic data exists for any of the run's problems.
 */
async function computeWeakTopic(
  stageData: StageData,
  userId: string
): Promise<string | null> {
  const allProblemIds = stageData.stages.flatMap((s) => s.problemIds);
  if (allProblemIds.length === 0) return null;

  const [problemTopics, solvedStatuses] = await Promise.all([
    prisma.problemTopic.findMany({
      where: { problemId: { in: allProblemIds } },
      include: { topic: { select: { id: true, name: true } } },
    }),
    prisma.userProblemStatus.findMany({
      where: {
        userId,
        problemId: { in: allProblemIds },
        status: "SOLVED",
      },
      select: { problemId: true },
    }),
  ]);

  if (problemTopics.length === 0) return null;

  const solvedSet = new Set(solvedStatuses.map((s) => s.problemId));

  const unsolvedCountByTopic = new Map<string, { name: string; count: number }>();
  for (const pt of problemTopics) {
    if (solvedSet.has(pt.problemId)) continue;
    const entry = unsolvedCountByTopic.get(pt.topicId);
    if (entry) {
      entry.count++;
    } else {
      unsolvedCountByTopic.set(pt.topicId, { name: pt.topic.name, count: 1 });
    }
  }

  if (unsolvedCountByTopic.size === 0) return null;

  let weakest: { name: string; count: number } | null = null;
  for (const entry of unsolvedCountByTopic.values()) {
    if (!weakest || entry.count > weakest.count) weakest = entry;
  }

  return weakest?.name ?? null;
}
