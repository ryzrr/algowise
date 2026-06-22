import { prisma } from "@/lib/prisma";
import { buildDigestData, renderDigestHtml, sendDigestToUser } from "@/lib/email-digest";

function isAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const [scheme, token] = authHeader.split(" ");
    if (scheme === "Bearer" && token === expected) {
      return true;
    }
  }

  const { searchParams } = new URL(request.url);
  const secretParam = searchParams.get("secret");
  if (secretParam && secretParam === expected) {
    return true;
  }

  return false;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const previewUserId = searchParams.get("preview");

  if (previewUserId) {
    const data = await buildDigestData(previewUserId);
    if (!data) {
      return new Response("User not found or has no email on file.", { status: 404 });
    }
    const html = renderDigestHtml(data);
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  }

  const users = await prisma.user.findMany({
    where: { email: { not: null } },
    select: { id: true },
  });

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const user of users) {
    const result = await sendDigestToUser(user.id);
    if ("sent" in result) {
      if (result.sent) {
        sent++;
      } else {
        errors++;
      }
    } else if (result.skipped) {
      skipped++;
    }
  }

  return Response.json({
    totalUsers: users.length,
    sent,
    skipped,
    errors,
  });
}
