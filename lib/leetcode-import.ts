import { prisma } from "@/lib/prisma";
import { checkAndAwardAchievements } from "@/lib/achievements";

const LEETCODE_GRAPHQL_ENDPOINT = "https://leetcode.com/graphql";

const RECENT_AC_SUBMISSIONS_QUERY = `query recentAcSubmissions($username: String!, $limit: Int!) { recentAcSubmissionList(username: $username, limit: $limit) { id title titleSlug timestamp } }`;

interface RawSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string;
}

interface LeetCodeGraphQLResponse {
  data?: {
    recentAcSubmissionList?: RawSubmission[] | null;
  } | null;
  errors?: { message: string }[];
}

export interface ImportedSubmission {
  title: string;
  titleSlug: string;
  solvedAt: Date;
}

export interface ImportSummary {
  totalFetched: number;
  imported: number;
  alreadySolved: number;
  notInCatalog: number;
}

/**
 * Fetches the given user's most recent ACCEPTED submissions from LeetCode's
 * public GraphQL API. LeetCode itself caps this list to roughly the last
 * 15-20 accepted submissions — there is no public, unauthenticated way to
 * retrieve a user's *entire* solved history.
 */
export async function fetchRecentAcceptedSubmissions(
  leetcodeUsername: string,
): Promise<ImportedSubmission[]> {
  let response: Response;

  try {
    response = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; AlgoWiseBot/1.0)",
      },
      body: JSON.stringify({
        query: RECENT_AC_SUBMISSIONS_QUERY,
        variables: { username: leetcodeUsername, limit: 20 },
      }),
    });
  } catch {
    throw new Error(
      "Could not reach LeetCode right now — please try again in a moment.",
    );
  }

  if (!response.ok) {
    throw new Error(
      "Could not find LeetCode submissions for that username — check the spelling or make sure your submissions aren't private.",
    );
  }

  let json: LeetCodeGraphQLResponse;
  try {
    json = (await response.json()) as LeetCodeGraphQLResponse;
  } catch {
    throw new Error(
      "Could not find LeetCode submissions for that username — check the spelling or make sure your submissions aren't private.",
    );
  }

  const submissions = json?.data?.recentAcSubmissionList;

  if (
    (json?.errors && json.errors.length > 0) ||
    !submissions ||
    !Array.isArray(submissions)
  ) {
    throw new Error(
      "Could not find LeetCode submissions for that username — check the spelling or make sure your submissions aren't private.",
    );
  }

  // Deduplicate by titleSlug, keeping the EARLIEST timestamp per slug (a
  // problem can show up multiple times if the user resubmitted it).
  const earliestBySlug = new Map<string, ImportedSubmission>();

  for (const submission of submissions) {
    if (!submission?.titleSlug || !submission?.timestamp) continue;

    const solvedAt = new Date(Number(submission.timestamp) * 1000);
    const existing = earliestBySlug.get(submission.titleSlug);

    if (!existing || solvedAt < existing.solvedAt) {
      earliestBySlug.set(submission.titleSlug, {
        title: submission.title,
        titleSlug: submission.titleSlug,
        solvedAt,
      });
    }
  }

  return Array.from(earliestBySlug.values());
}

/**
 * Imports a LeetCode user's recent accepted submissions into AlgoWise,
 * matching them against the local Problem catalog by slug and upserting
 * UserProblemStatus rows to SOLVED.
 */
export async function importLeetCodeProgress(
  userId: string,
  leetcodeUsername: string,
): Promise<ImportSummary> {
  const submissions = await fetchRecentAcceptedSubmissions(leetcodeUsername);

  let imported = 0;
  let alreadySolved = 0;
  let notInCatalog = 0;

  for (const submission of submissions) {
    const problem = await prisma.problem.findUnique({
      where: { slug: submission.titleSlug },
    });

    if (!problem) {
      notInCatalog++;
      continue;
    }

    const existingStatus = await prisma.userProblemStatus.findUnique({
      where: { userId_problemId: { userId, problemId: problem.id } },
    });

    if (existingStatus?.status === "SOLVED") {
      alreadySolved++;

      // Only overwrite solvedAt if the LeetCode timestamp is earlier than
      // what's already stored — never clobber a correct local date with a
      // worse (later) one.
      if (
        existingStatus.solvedAt &&
        submission.solvedAt < existingStatus.solvedAt
      ) {
        await prisma.userProblemStatus.update({
          where: { id: existingStatus.id },
          data: { solvedAt: submission.solvedAt },
        });
      }

      continue;
    }

    await prisma.userProblemStatus.upsert({
      where: { userId_problemId: { userId, problemId: problem.id } },
      create: {
        userId,
        problemId: problem.id,
        status: "SOLVED",
        solvedAt: submission.solvedAt,
      },
      update: {
        status: "SOLVED",
        solvedAt: submission.solvedAt,
      },
    });

    imported++;
  }

  await checkAndAwardAchievements(userId);

  return {
    totalFetched: submissions.length,
    imported,
    alreadySolved,
    notInCatalog,
  };
}
