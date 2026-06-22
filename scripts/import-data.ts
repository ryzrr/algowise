/**
 * One-time (re-runnable) data import.
 *
 * Company-question mapping: hxu296/leetcode-company-wise-problems-2022 (MIT licensed).
 * Problem metadata (difficulty/acceptance rate/paid-only): LeetCode's public "all problems" endpoint.
 * See ATTRIBUTION.md.
 */
import { parse } from "csv-parse/sync";
import { writeFileSync, existsSync, readFileSync, mkdirSync } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { Difficulty } from "@prisma/client";

const REPO = "hxu296/leetcode-company-wise-problems-2022";
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/main`;
const API_BASE = `https://api.github.com/repos/${REPO}`;
const CACHE_PATH = path.join(process.cwd(), "data", "leetcode-problems.json");
const TOPICS_CACHE_PATH = path.join(process.cwd(), "data", "leetcode-topics.json");

type LeetCodeMeta = {
  title: string;
  difficulty: Difficulty;
  acceptanceRate: number | null;
  isPaidOnly: boolean;
};

type RawStatPair = {
  stat: {
    question__title: string;
    question__title_slug: string;
    total_acs: number;
    total_submitted: number;
  };
  difficulty: { level: number };
  paid_only: boolean;
};

function difficultyFromLevel(level: number): Difficulty {
  if (level === 1) return Difficulty.EASY;
  if (level === 2) return Difficulty.MEDIUM;
  if (level === 3) return Difficulty.HARD;
  return Difficulty.UNKNOWN;
}

function slugFromLink(link: string): string {
  return link.replace(/\/$/, "").split("/").filter(Boolean).pop() ?? "";
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function loadLeetCodeMeta(): Promise<Map<string, LeetCodeMeta>> {
  if (existsSync(CACHE_PATH)) {
    console.log("Using cached LeetCode metadata:", CACHE_PATH);
    const raw = JSON.parse(readFileSync(CACHE_PATH, "utf-8")) as Record<
      string,
      LeetCodeMeta
    >;
    return new Map(Object.entries(raw));
  }

  console.log("Fetching LeetCode problem metadata...");
  const res = await fetch("https://leetcode.com/api/problems/all/");
  if (!res.ok) throw new Error(`LeetCode API failed: ${res.status}`);
  const json = (await res.json()) as { stat_status_pairs: RawStatPair[] };

  const map = new Map<string, LeetCodeMeta>();
  for (const pair of json.stat_status_pairs) {
    const { stat, difficulty, paid_only } = pair;
    const acceptanceRate =
      stat.total_submitted > 0
        ? Math.round((stat.total_acs / stat.total_submitted) * 1000) / 10
        : null;
    map.set(stat.question__title_slug, {
      title: stat.question__title,
      difficulty: difficultyFromLevel(difficulty.level),
      acceptanceRate,
      isPaidOnly: paid_only,
    });
  }

  mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify(Object.fromEntries(map), null, 2));
  console.log(`Cached metadata for ${map.size} problems.`);
  return map;
}

async function loadLeetCodeTopics(): Promise<Map<string, string[]>> {
  if (existsSync(TOPICS_CACHE_PATH)) {
    console.log("Using cached LeetCode topics:", TOPICS_CACHE_PATH);
    const raw = JSON.parse(readFileSync(TOPICS_CACHE_PATH, "utf-8")) as Record<string, string[]>;
    return new Map(Object.entries(raw));
  }

  console.log("Fetching LeetCode problem topics via GraphQL...");
  const res = await fetch("https://leetcode.com/graphql/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query {
          questionList(categorySlug: "", limit: 3500, skip: 0, filters: {}) {
            data {
              titleSlug
              topicTags {
                name
              }
            }
          }
        }
      `
    })
  });
  if (!res.ok) throw new Error(`LeetCode GraphQL API failed: ${res.status}`);
  const json = await res.json() as any;
  const questions = json?.data?.questionList?.data || [];

  const map = new Map<string, string[]>();
  for (const q of questions) {
    if (q.titleSlug && q.topicTags) {
      map.set(q.titleSlug, q.topicTags.map((t: any) => t.name));
    }
  }

  mkdirSync(path.dirname(TOPICS_CACHE_PATH), { recursive: true });
  writeFileSync(TOPICS_CACHE_PATH, JSON.stringify(Object.fromEntries(map), null, 2));
  console.log(`Cached topics for ${map.size} problems.`);
  return map;
}

async function listCompanyFiles(): Promise<{ name: string; slug: string }[]> {
  const res = await fetch(`${API_BASE}/contents/companies`);
  if (!res.ok) throw new Error(`GitHub contents API failed: ${res.status}`);
  const entries = (await res.json()) as { name: string }[];
  return entries
    .filter((e) => e.name.endsWith(".csv"))
    .map((e) => ({ name: e.name, slug: e.name.replace(/\.csv$/, "") }));
}

async function importCompany(
  fileName: string,
  leetcodeMeta: Map<string, LeetCodeMeta>,
  leetcodeTopics: Map<string, string[]>
) {
  const companyName = fileName.replace(/\.csv$/, "");
  const companySlug = slugify(companyName);

  const res = await fetch(
    `${RAW_BASE}/companies/${encodeURIComponent(fileName)}`
  );
  if (!res.ok) {
    console.warn(`  skip ${fileName}: ${res.status}`);
    return;
  }
  const csvText = await res.text();
  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
  }) as { problem_link: string; problem_name: string; num_occur: string }[];

  const company = await prisma.company.upsert({
    where: { slug: companySlug },
    update: { name: companyName, problemCount: rows.length },
    create: { name: companyName, slug: companySlug, problemCount: rows.length },
  });

  for (const row of rows) {
    const slug = slugFromLink(row.problem_link);
    if (!slug) continue;
    const meta = leetcodeMeta.get(slug);

    const problem = await prisma.problem.upsert({
      where: { slug },
      update: {
        title: meta?.title ?? row.problem_name,
        difficulty: meta?.difficulty ?? Difficulty.UNKNOWN,
        acceptanceRate: meta?.acceptanceRate ?? null,
        isPaidOnly: meta?.isPaidOnly ?? false,
      },
      create: {
        slug,
        title: meta?.title ?? row.problem_name,
        link: row.problem_link,
        difficulty: meta?.difficulty ?? Difficulty.UNKNOWN,
        acceptanceRate: meta?.acceptanceRate ?? null,
        isPaidOnly: meta?.isPaidOnly ?? false,
      },
    });

    await prisma.companyProblem.upsert({
      where: { companyId_problemId: { companyId: company.id, problemId: problem.id } },
      update: { frequency: parseInt(row.num_occur, 10) || 1 },
      create: {
        companyId: company.id,
        problemId: problem.id,
        frequency: parseInt(row.num_occur, 10) || 1,
      },
    });

    const topics = leetcodeTopics.get(slug) || [];
    for (const t of topics) {
      const topicSlug = slugify(t);
      const topic = await prisma.topic.upsert({
        where: { slug: topicSlug },
        update: { name: t },
        create: { name: t, slug: topicSlug },
      });
      await prisma.problemTopic.upsert({
        where: { problemId_topicId: { problemId: problem.id, topicId: topic.id } },
        update: {},
        create: { problemId: problem.id, topicId: topic.id },
      });
    }
  }

  console.log(`  ${companyName}: ${rows.length} problems`);
}

async function main() {
  const leetcodeMeta = await loadLeetCodeMeta();
  const leetcodeTopics = await loadLeetCodeTopics();
  const companyFiles = await listCompanyFiles();
  console.log(`Importing ${companyFiles.length} companies...`);

  for (const { name } of companyFiles) {
    await importCompany(name, leetcodeMeta, leetcodeTopics);
  }

  const [companyCount, problemCount] = await Promise.all([
    prisma.company.count(),
    prisma.problem.count(),
  ]);
  console.log(`Done. ${companyCount} companies, ${problemCount} unique problems.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
