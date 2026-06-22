import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth";
import { getProblemDiscussionPage } from "@/lib/discussions";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { ProblemDiscussion } from "@/components/problem-discussion";

export default async function ProblemDiscussionPage({
  params,
}: {
  params: Promise<{ problemId: string }>;
}) {
  const { problemId } = await params;
  const session = await auth();
  const userId = session!.user!.id!;

  const data = await getProblemDiscussionPage(problemId);
  if (!data) notFound();

  const { problem, threads } = data;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {problem.title}
          </h1>
          <a
            href={problem.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="size-5" />
            <span className="sr-only">Open problem link</span>
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={problem.difficulty} />
          {problem.company ? (
            <Badge variant="outline">{problem.company.name}</Badge>
          ) : null}
        </div>
      </div>

      <ProblemDiscussion
        problemId={problem.id}
        threads={threads}
        currentUserId={userId}
      />
    </div>
  );
}
