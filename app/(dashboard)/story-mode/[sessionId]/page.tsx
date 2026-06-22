import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy, Skull, RotateCcw } from "lucide-react";
import { auth } from "@/lib/auth";
import { getStorySession, STAGES } from "@/lib/story-mode";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StoryModeConfetti } from "@/components/story-mode-confetti";
import { StoryModeStageView } from "@/components/story-mode-stage-view";

export default async function StoryModeSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await auth();
  const userId = session!.user!.id!;

  const story = await getStorySession(sessionId, userId);
  if (!story) notFound();

  if (story.status === "PASSED") {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
        <StoryModeConfetti />
        <div className="flex flex-col items-center gap-3 rounded-xl border border-primary/30 bg-card py-12 text-center duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
          <Trophy className="size-14 text-amber-400" />
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            You got the offer! 🎉
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            You made it through every stage of {story.companyName}&apos;s
            interview process. Welcome aboard.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {story.allStages.map((s, i) => (
            <div
              key={s.name}
              className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-4 text-center"
            >
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Stage {i + 1}
              </span>
              <span className="text-sm font-semibold">{s.name}</span>
              <span className="text-xs text-emerald-400">Passed</span>
            </div>
          ))}
        </div>

        <Link href="/story-mode" className={cn(buttonVariants({ variant: "outline" }), "self-center")}>
          <RotateCcw />
          Try another company
        </Link>
      </div>
    );
  }

  if (story.status === "FAILED") {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-card py-12 text-center duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
          <Skull className="size-14 text-destructive" />
          <h1 className="font-heading text-3xl font-bold tracking-tight">Rejected</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            You ran out of time during the {story.stageName} at{" "}
            {story.companyName}.
          </p>
          {story.weakTopic ? (
            <p className="max-w-md text-sm text-muted-foreground">
              Post-mortem: your weakest area this run was{" "}
              <span className="font-semibold text-foreground">{story.weakTopic}</span>.
              Drill more problems on that topic before your next attempt.
            </p>
          ) : (
            <p className="max-w-md text-sm text-muted-foreground">
              Post-mortem: not enough topic data to pinpoint a weak spot this run.
            </p>
          )}
        </div>

        <Link href="/story-mode" className={cn(buttonVariants(), "self-center")}>
          <RotateCcw />
          Try again
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <StoryModeStageView
        sessionId={story.sessionId}
        stageName={story.stageName}
        stageNumber={story.stageNumber}
        totalStages={story.totalStages}
        timeLimitMinutes={story.timeLimitMinutes || STAGES[story.stageIndex]?.timeLimitMinutes || 0}
        startedAt={story.startedAt}
        rows={story.rows}
        companySlug={story.companySlug}
      />
    </div>
  );
}
