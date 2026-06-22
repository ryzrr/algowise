"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Brain, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { reviewProblem } from "@/actions/revision-actions";

export type DueReviewItem = {
  problemId: string;
  title: string;
  link: string;
  difficulty: string;
};

export function DueReviewPanel({ items }: { items: DueReviewItem[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  if (items.length === 0) return null;

  function handleReview(problemId: string, outcome: "easy" | "struggled") {
    startTransition(async () => {
      await reviewProblem(problemId, outcome);
      toast.success(outcome === "easy" ? "Interval doubled — see you later." : "Reset to day 1 — keep at it.");
      router.refresh();
    });
  }

  return (
    <Card className="gap-3 p-5 duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Brain className="size-4 text-primary" />
        <span className="label-mono">Due for review today ({items.length})</span>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.problemId}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2"
          >
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
            >
              {item.title}
              <ExternalLink className="size-3 opacity-50" />
            </a>
            <div className="flex items-center gap-2">
              <DifficultyBadge difficulty={item.difficulty} />
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => handleReview(item.problemId, "struggled")}
              >
                <RotateCcw className="size-3" />
                Struggled
              </Button>
              <Button
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleReview(item.problemId, "easy")}
              >
                Got it easily
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
