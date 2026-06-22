/**
 * match.ts — Pure scoring engine for Company Match Score
 * No Prisma here. Just math. Testable in isolation.
 */

export type DifficultyDist = {
  EASY: number;
  MEDIUM: number;
  HARD: number;
  total: number;
};

export type TopicVector = Record<string, number>; // topicId -> count

export type RawCompanyData = {
  companyId: string;
  companyName: string;
  companySlug: string;
  totalProblems: number;
  difficultyDist: DifficultyDist;
  topicVector: TopicVector; // topics across all problems
};

export type RawUserData = {
  solvedProblemIds: Set<string>;
  solvedByCompany: Map<string, number>; // companyId -> solved count
  difficultyDist: DifficultyDist; // user's overall solved difficulty dist
  topicVector: TopicVector; // topics across all solved problems
};

export type MatchResult = {
  companyId: string;
  companyName: string;
  companySlug: string;
  score: number; // 0-100
  coverageScore: number;
  difficultyScore: number;
  topicScore: number;
  solved: number;
  total: number;
  tier: "elite" | "strong" | "growing" | "early";
  topGapTopics: string[]; // topics company asks that user hasn't practiced
};

/**
 * Compute coverage score: what % of the company's problems has the user solved?
 * Uses a square root curve so early progress feels more meaningful.
 */
function coverageScore(solved: number, total: number): number {
  if (total === 0) return 0;
  const raw = solved / total;
  // sqrt curve: 25% solved -> ~50% score, 50% solved -> ~71% score, 100% solved -> 100%
  return Math.round(Math.sqrt(raw) * 100);
}

/**
 * Compute difficulty alignment score.
 * Compares the user's solved difficulty distribution against the company's required distribution.
 * Uses 1 - L1 distance (Manhattan distance) normalized to [0,100].
 */
function difficultyScore(userDist: DifficultyDist, companyDist: DifficultyDist): number {
  if (companyDist.total === 0 || userDist.total === 0) return 50; // neutral

  const compEasy = companyDist.EASY / companyDist.total;
  const compMed = companyDist.MEDIUM / companyDist.total;
  const compHard = companyDist.HARD / companyDist.total;

  const userEasy = userDist.EASY / userDist.total;
  const userMed = userDist.MEDIUM / userDist.total;
  const userHard = userDist.HARD / userDist.total;

  const l1 = Math.abs(userEasy - compEasy) + Math.abs(userMed - compMed) + Math.abs(userHard - compHard);
  // l1 is in [0, 2]. 0 = perfect match, 2 = perfect mismatch.
  return Math.round((1 - l1 / 2) * 100);
}

/**
 * Compute topic alignment score using cosine-similarity-inspired approach.
 * Compares the user's practiced topic frequency vector against the company's topic vector.
 */
function topicAlignmentScore(
  userVector: TopicVector,
  companyVector: TopicVector
): { score: number; gapTopics: string[] } {
  const companyTopics = Object.keys(companyVector);
  if (companyTopics.length === 0) return { score: 50, gapTopics: [] };

  // Dot product of normalized vectors
  let dot = 0;
  let compMag = 0;
  let userMag = 0;
  const gapTopics: Array<{ topicId: string; weight: number }> = [];

  for (const topicId of companyTopics) {
    const cw = companyVector[topicId] ?? 0;
    const uw = userVector[topicId] ?? 0;
    dot += cw * uw;
    compMag += cw * cw;

    if (uw === 0 && cw > 0) {
      gapTopics.push({ topicId, weight: cw });
    }
  }

  for (const topicId of Object.keys(userVector)) {
    userMag += (userVector[topicId] ?? 0) ** 2;
  }

  const denom = Math.sqrt(compMag) * Math.sqrt(userMag);
  const cosine = denom === 0 ? 0 : dot / denom;

  // Sort gap topics by how heavily the company asks them
  gapTopics.sort((a, b) => b.weight - a.weight);

  return {
    score: Math.round(cosine * 100),
    gapTopics: gapTopics.slice(0, 3).map((g) => g.topicId),
  };
}

function getTier(score: number): MatchResult["tier"] {
  if (score >= 75) return "elite";
  if (score >= 50) return "strong";
  if (score >= 25) return "growing";
  return "early";
}

export function computeMatchScores(
  companies: RawCompanyData[],
  user: RawUserData,
  topicIdToName: Map<string, string>
): MatchResult[] {
  return companies
    .map((company) => {
      const solved = user.solvedByCompany.get(company.companyId) ?? 0;

      const cov = coverageScore(solved, company.totalProblems);
      const diff = difficultyScore(user.difficultyDist, company.difficultyDist);
      const { score: topic, gapTopics: gapIds } = topicAlignmentScore(
        user.topicVector,
        company.topicVector
      );

      // Weighted composite
      const composite = Math.round(cov * 0.55 + diff * 0.25 + topic * 0.20);

      return {
        companyId: company.companyId,
        companyName: company.companyName,
        companySlug: company.companySlug,
        score: Math.min(100, composite),
        coverageScore: cov,
        difficultyScore: diff,
        topicScore: topic,
        solved,
        total: company.totalProblems,
        tier: getTier(composite),
        topGapTopics: gapIds.map((id) => topicIdToName.get(id) ?? id),
      };
    })
    .sort((a, b) => b.score - a.score);
}
