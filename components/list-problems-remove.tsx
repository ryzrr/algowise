"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeProblemFromList } from "@/actions/list-actions";

export function ListProblemsRemove({
  listId,
  problems,
}: {
  listId: string;
  problems: { problemId: string; title: string }[];
}) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (problems.length === 0) return null;

  function handleRemove(problemId: string) {
    setRemovingId(problemId);
    startTransition(async () => {
      await removeProblemFromList(listId, problemId);
      setRemovingId(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Remove from list
      </p>
      <div className="flex flex-wrap gap-2">
        {problems.map((p) => (
          <span
            key={p.problemId}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pr-1.5 pl-3 text-xs"
          >
            <span className="max-w-48 truncate">{p.title}</span>
            <Button
              size="icon-xs"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => handleRemove(p.problemId)}
              disabled={removingId === p.problemId}
            >
              {removingId === p.problemId ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <X className="size-3" />
              )}
              <span className="sr-only">Remove {p.title}</span>
            </Button>
          </span>
        ))}
      </div>
    </div>
  );
}
