"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { ExternalLink, CheckCircle2, Flame } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { toggleSolved } from "@/actions/problem-actions";
import { cn } from "@/lib/utils";

export type DailyChallengeData = {
  problemId: string;
  title: string;
  link: string;
  difficulty: string;
  company: { name: string; slug: string } | null;
  solvedCount: number;
  completedByUser: boolean;
};

export function DailyChallengeBanner({ challenge }: { challenge: DailyChallengeData }) {
  const [completed, setCompleted] = useState(challenge.completedByUser);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function handleMarkSolved() {
    if (completed) return;
    setCompleted(true);
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, scalar: 0.9 });
    toast.success("Problem of the Day solved!");
    startTransition(async () => {
      await toggleSolved(challenge.problemId, challenge.company?.slug);
      router.refresh();
    });
  }

  return (
    <Card
      className={cn(
        "relative gap-3 overflow-hidden p-5 duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both",
        completed && "ring-1 ring-inset ring-emerald-500/40"
      )}
    >
      <span className="absolute top-4 bottom-4 left-0 w-0.5 rounded-r-full bg-primary" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Flame className="size-4 text-primary" />
          <span className="label-mono">Problem of the Day</span>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {challenge.solvedCount} AlgoWise user{challenge.solvedCount === 1 ? "" : "s"} solved this today
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a
            href={challenge.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-heading text-lg font-semibold hover:underline"
          >
            {challenge.title}
            <ExternalLink className="size-3.5 opacity-50" />
          </a>
          <DifficultyBadge difficulty={challenge.difficulty} />
          {challenge.company && (
            <span className="text-xs text-muted-foreground">via {challenge.company.name}</span>
          )}
        </div>

        {completed ? (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-3 py-1.5 text-sm font-medium text-emerald-400"
          >
            <CheckCircle2 className="size-4" />
            Solved today
          </motion.span>
        ) : (
          <Button size="sm" onClick={handleMarkSolved}>
            Mark as solved
          </Button>
        )}
      </div>
    </Card>
  );
}
