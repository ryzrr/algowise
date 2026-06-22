"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { ExternalLink, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { cn } from "@/lib/utils";
import { submitBlindGuess } from "@/actions/blind-mode-actions";
import type { BlindModeProblem } from "@/lib/blind-mode";

type RevealResult = {
  correct: boolean;
  actualCompany: { id: string; name: string };
  difficulty: string;
};

export function BlindModeGame({ problem }: { problem: BlindModeProblem }) {
  const router = useRouter();
  const [guessedCompanyId, setGuessedCompanyId] = useState<string | null>(null);
  const [result, setResult] = useState<RevealResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const revealed = result !== null;

  function handleGuess(companyId: string) {
    if (revealed || isPending) return;
    setGuessedCompanyId(companyId);
    startTransition(async () => {
      const res = await submitBlindGuess(problem.problemId, companyId);
      setResult(res);
      if (res.correct) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          scalar: 0.8,
          ticks: 180,
        });
        toast.success(`Correct! This was an ${res.actualCompany.name} problem.`);
      } else {
        toast.error(`Not quite — this was an ${res.actualCompany.name} problem.`);
      }
    });
  }

  function handleNext() {
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <a
            href={problem.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:underline"
          >
            {problem.title}
            <ExternalLink className="size-3.5 opacity-50" />
          </a>
          {revealed ? (
            <DifficultyBadge difficulty={result.difficulty} />
          ) : (
            <Badge variant="outline" className="blur-[3px] select-none">
              ???
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <p className="text-sm text-muted-foreground">
          Which company do you think asked this problem most frequently?
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {problem.options.map((option) => {
            const isGuessed = guessedCompanyId === option.id;
            const isActual = revealed && result.actualCompany.id === option.id;
            const isWrongGuess = revealed && isGuessed && !result.correct;

            return (
              <Button
                key={option.id}
                type="button"
                variant={isGuessed && !revealed ? "default" : "outline"}
                disabled={isPending || revealed}
                onClick={() => handleGuess(option.id)}
                className={cn(
                  "h-auto justify-between py-3 text-left whitespace-normal",
                  revealed && isActual && "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
                  isWrongGuess && "border-rose-500/50 bg-rose-500/10 text-rose-400"
                )}
              >
                <span className="truncate">{option.name}</span>
                {revealed && isActual && <CheckCircle2 className="size-4 shrink-0" />}
                {isWrongGuess && <XCircle className="size-4 shrink-0" />}
              </Button>
            );
          })}
        </div>

        {revealed && (
          <div
            className={cn(
              "flex flex-col gap-2 rounded-lg border p-4",
              result.correct
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-rose-500/30 bg-rose-500/10"
            )}
          >
            <div
              className={cn(
                "flex items-center gap-2 text-sm font-medium",
                result.correct ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {result.correct ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <XCircle className="size-4" />
              )}
              {result.correct ? "Correct guess!" : "Incorrect guess"}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Actual company:
              <span className="font-medium text-foreground">{result.actualCompany.name}</span>
              <DifficultyBadge difficulty={result.difficulty} />
            </div>
            <Button
              type="button"
              variant="secondary"
              className="mt-2 w-fit"
              onClick={handleNext}
            >
              Next problem
              <ArrowRight className="size-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
