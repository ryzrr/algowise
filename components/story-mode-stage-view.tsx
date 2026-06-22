"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProblemTable, type ProblemRow } from "@/components/problem-table";
import { cn } from "@/lib/utils";
import { evaluateCurrentStageAction } from "@/actions/story-mode-actions";

const STAGE_FLAVOR: Record<string, string> = {
  "Recruiter Screen": "A quick gut-check before they invest more time in you.",
  "Phone Screen": "One problem, thirty minutes, and a stranger judging your silence.",
  "Onsite Round 1": "You're in the building now. Two problems stand between you and lunch.",
  "Onsite Round 2": "The final gate. One hard problem, and then it's out of your hands.",
};

function formatTime(totalSeconds: number) {
  const sign = totalSeconds < 0 ? "-" : "";
  const abs = Math.abs(totalSeconds);
  const minutes = Math.floor(abs / 60);
  const seconds = abs % 60;
  return `${sign}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function StoryModeStageView({
  sessionId,
  stageName,
  stageNumber,
  totalStages,
  timeLimitMinutes,
  startedAt,
  rows,
  companySlug,
}: {
  sessionId: string;
  stageName: string;
  stageNumber: number;
  totalStages: number;
  timeLimitMinutes: number;
  startedAt: string | null;
  rows: ProblemRow[];
  companySlug: string;
}) {
  const router = useRouter();
  const [evaluating, setEvaluating] = useState(false);
  const autoEvaluatedRef = useRef(false);

  const evaluate = useCallback(async () => {
    setEvaluating(true);
    try {
      await evaluateCurrentStageAction(sessionId);
      router.refresh();
    } finally {
      setEvaluating(false);
    }
  }, [sessionId, router]);

  const totalSeconds = timeLimitMinutes * 60;
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(() => {
    if (!startedAt) return totalSeconds;
    const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    return totalSeconds - elapsed;
  });

  useEffect(() => {
    if (!startedAt) return;
    const startMs = new Date(startedAt).getTime();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startMs) / 1000);
      setRemainingSeconds(totalSeconds - elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt, totalSeconds]);

  // Auto-evaluate the moment the timer hits zero — only fires once per stage.
  useEffect(() => {
    if (remainingSeconds === null) return;
    if (remainingSeconds <= 0 && !autoEvaluatedRef.current) {
      autoEvaluatedRef.current = true;
      evaluate();
    }
  }, [remainingSeconds, evaluate]);

  const isLow = remainingSeconds !== null && remainingSeconds <= 60;
  const solvedCount = rows.filter((r) => r.status === "SOLVED").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: totalStages }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 flex-1 max-w-24 rounded-full transition-colors",
              i + 1 < stageNumber
                ? "bg-primary"
                : i + 1 === stageNumber
                  ? "bg-primary/60"
                  : "bg-muted"
            )}
          />
        ))}
      </div>

      <div className="text-center">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Stage {stageNumber} of {totalStages}
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight">{stageName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {STAGE_FLAVOR[stageName] ?? "Stay sharp."}
        </p>
      </div>

      <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card py-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="size-4" />
          <span className="label-mono text-xs">Time remaining</span>
        </div>
        <div
          className={cn(
            "font-mono text-4xl font-bold tabular-nums",
            isLow ? "text-destructive" : "text-foreground"
          )}
        >
          {remainingSeconds !== null ? formatTime(remainingSeconds) : "--:--"}
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5" />
          {solvedCount}/{rows.length} solved
        </p>
      </div>

      <ProblemTable rows={rows} companySlug={companySlug} showFrequency={false} />

      <Button
        size="lg"
        className="self-center"
        onClick={evaluate}
        disabled={evaluating}
      >
        {evaluating ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
        I&apos;m done — evaluate
      </Button>
    </div>
  );
}
