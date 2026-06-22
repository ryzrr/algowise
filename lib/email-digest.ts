import { prisma } from "@/lib/prisma";
import { getOverallStats, getWeeklyDelta, getAlgorithmAnalytics } from "@/lib/data";
import { getResendClient } from "@/lib/resend-client";

export type DigestData = {
  name: string | null;
  email: string;
  overallStats: Awaited<ReturnType<typeof getOverallStats>>;
  weeklyDelta: Awaited<ReturnType<typeof getWeeklyDelta>>;
  weakestTopics: Awaited<ReturnType<typeof getAlgorithmAnalytics>>;
  strongestTopic: Awaited<ReturnType<typeof getAlgorithmAnalytics>>[number] | null;
  dueForReviewCount: number;
};

/**
 * Gathers everything needed to render a weekly digest email for a user.
 * Returns null if the user doesn't exist or has no email on file —
 * there's nowhere to send the digest in that case.
 */
export async function buildDigestData(userId: string): Promise<DigestData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  if (!user || !user.email) {
    return null;
  }

  const [overallStats, weeklyDelta, algorithmAnalytics, dueForReviewCount] = await Promise.all([
    getOverallStats(userId),
    getWeeklyDelta(userId),
    getAlgorithmAnalytics(userId),
    prisma.userProblemStatus.count({
      where: { userId, nextReviewAt: { lte: new Date() } },
    }),
  ]);

  // Top 8 radar topics, sorted ascending by score so the weakest 3 are most useful.
  const bySoreAsc = [...algorithmAnalytics].sort((a, b) => a.score - b.score);
  const weakestTopics = bySoreAsc.slice(0, 3);
  const strongestTopic =
    algorithmAnalytics.length > 0
      ? [...algorithmAnalytics].sort((a, b) => b.score - a.score)[0]
      : null;

  return {
    name: user.name,
    email: user.email,
    overallStats,
    weeklyDelta,
    weakestTopics,
    strongestTopic,
    dueForReviewCount,
  };
}

const COLORS = {
  bg: "#f4f4f5",
  card: "#ffffff",
  border: "#e4e4e7",
  text: "#18181b",
  muted: "#71717a",
  accent: "#22c55e",
  accentDark: "#15803d",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statBlock(label: string, value: string, accent = false) {
  return `
    <td style="padding: 12px 16px; text-align: center; ${accent ? `border-left: 1px solid ${COLORS.border};` : ""}">
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: 700; color: ${accent ? COLORS.accentDark : COLORS.text};">
        ${value}
      </div>
      <div style="font-size: 12px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px;">
        ${label}
      </div>
    </td>`;
}

/**
 * Renders the full weekly digest as a standalone HTML email string.
 * Plain inline styles only (no external CSS/Tailwind) for email-client compatibility.
 */
export function renderDigestHtml(data: DigestData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const revisionUrl = `${appUrl}/revision`;

  const displayName = data.name ? escapeHtml(data.name) : "there";

  const { totalSolved, streak } = data.overallStats;
  const { thisWeek, deltaPct } = data.weeklyDelta;

  const deltaSign = deltaPct > 0 ? "+" : "";

  const streakCopy = streak.solvedToday
    ? "Nice work — you've already kept the streak alive today."
    : "You haven't solved anything today yet — solve one today to keep it alive.";

  const weakestRows = data.weakestTopics
    .map(
      (t) => `
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: ${COLORS.text};">${escapeHtml(t.topic)}</td>
        <td style="padding: 6px 0; font-size: 14px; color: ${COLORS.muted}; text-align: right;">${t.solved}/${t.total} solved &middot; score ${t.score}</td>
      </tr>`
    )
    .join("");

  const strengthRow = data.strongestTopic
    ? `
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: ${COLORS.accentDark}; font-weight: 700;">${escapeHtml(data.strongestTopic.topic)} &#9733;</td>
        <td style="padding: 6px 0; font-size: 14px; color: ${COLORS.muted}; text-align: right;">${data.strongestTopic.solved}/${data.strongestTopic.total} solved &middot; score ${data.strongestTopic.score}</td>
      </tr>`
    : "";

  return `<html>
  <body style="margin: 0; padding: 0; background-color: ${COLORS.bg}; font-family: Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.bg}; padding: 32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.card}; border-radius: 12px; overflow: hidden; border: 1px solid ${COLORS.border};">
            <tr>
              <td style="background-color: ${COLORS.accent}; height: 6px; font-size: 0; line-height: 0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding: 32px 32px 8px 32px;">
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 22px; font-weight: 700; color: ${COLORS.text}; letter-spacing: -0.02em;">
                  AlgoWise
                </div>
                <div style="font-size: 13px; color: ${COLORS.muted}; margin-top: 2px;">
                  Your weekly digest
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 32px 0 32px;">
                <p style="font-size: 15px; color: ${COLORS.text}; margin: 0;">
                  Hey ${displayName} &mdash; here's how your week went.
                </p>
              </td>
            </tr>

            <!-- This week -->
            <tr>
              <td style="padding: 24px 32px 0 32px;">
                <div style="font-size: 12px; font-weight: 700; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">
                  This week
                </div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${COLORS.border}; border-radius: 8px;">
                  <tr>
                    ${statBlock("Solved this week", String(thisWeek))}
                    ${statBlock("vs last week", `${deltaSign}${deltaPct}%`, true)}
                    ${statBlock("Total solved", String(totalSolved), true)}
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Streak -->
            <tr>
              <td style="padding: 24px 32px 0 32px;">
                <div style="font-size: 12px; font-weight: 700; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">
                  Streak
                </div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${COLORS.border}; border-radius: 8px;">
                  <tr>
                    ${statBlock("Current streak", `${streak.currentStreak}d`)}
                    ${statBlock("Longest streak", `${streak.longestStreak}d`, true)}
                  </tr>
                </table>
                <p style="font-size: 13px; color: ${COLORS.muted}; margin: 8px 0 0 0;">
                  ${streakCopy}
                </p>
              </td>
            </tr>

            <!-- Algorithm focus -->
            <tr>
              <td style="padding: 24px 32px 0 32px;">
                <div style="font-size: 12px; font-weight: 700; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">
                  Algorithm focus
                </div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${COLORS.border}; border-radius: 8px; padding: 12px 16px;">
                  ${
                    weakestRows ||
                    `<tr><td style="padding: 6px 0; font-size: 14px; color: ${COLORS.muted};">Not enough data yet — solve a few problems to see your topic breakdown.</td></tr>`
                  }
                  ${strengthRow}
                </table>
              </td>
            </tr>

            <!-- Due for review -->
            <tr>
              <td style="padding: 24px 32px 0 32px;">
                <div style="font-size: 12px; font-weight: 700; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">
                  Due for review
                </div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${COLORS.border}; border-radius: 8px;">
                  <tr>
                    <td style="padding: 16px;">
                      <p style="margin: 0 0 12px 0; font-size: 14px; color: ${COLORS.text};">
                        You have <strong>${data.dueForReviewCount}</strong> problem${data.dueForReviewCount === 1 ? "" : "s"} due for spaced-repetition review.
                      </p>
                      <a href="${revisionUrl}" style="display: inline-block; background-color: ${COLORS.accent}; color: #052e16; font-weight: 700; font-size: 13px; text-decoration: none; padding: 10px 18px; border-radius: 6px;">
                        Review now &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 32px 32px 32px 32px;">
                <hr style="border: none; border-top: 1px solid ${COLORS.border}; margin: 0 0 16px 0;" />
                <p style="font-size: 12px; color: ${COLORS.muted}; margin: 0;">
                  You're receiving this because you have an AlgoWise account. Keep grinding &mdash; consistency beats intensity.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export type SendDigestResult =
  | { skipped: true; reason: "no-email" | "resend-not-configured" }
  | { sent: true }
  | { sent: false; error: string };

/**
 * Builds, renders, and sends the weekly digest email to a single user.
 * Never throws: missing email / missing Resend config are reported as
 * "skipped" results, and Resend API failures are caught and reported
 * as "sent: false" results.
 */
export async function sendDigestToUser(userId: string): Promise<SendDigestResult> {
  const data = await buildDigestData(userId);
  if (!data) {
    return { skipped: true, reason: "no-email" };
  }

  const resend = getResendClient();
  if (!resend) {
    return { skipped: true, reason: "resend-not-configured" };
  }

  const html = renderDigestHtml(data);

  try {
    await resend.emails.send({
      from: process.env.DIGEST_FROM_EMAIL!,
      to: data.email,
      subject: "Your AlgoWise weekly digest",
      html,
    });
    return { sent: true };
  } catch (error) {
    return { sent: false, error: error instanceof Error ? error.message : String(error) };
  }
}
