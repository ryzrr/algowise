"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { importLeetCodeProgressAction } from "@/actions/import-actions";

export function LeetCodeImportForm() {
  const [username, setUsername] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const summary = await importLeetCodeProgressAction(username);
        toast.success(
          `Imported ${summary.imported} problem${summary.imported === 1 ? "" : "s"} from your last ${summary.totalFetched} accepted LeetCode submission${summary.totalFetched === 1 ? "" : "s"}.` +
            (summary.alreadySolved > 0
              ? ` ${summary.alreadySolved} were already marked solved.`
              : "") +
            (summary.notInCatalog > 0
              ? ` ${summary.notInCatalog} aren't in AlgoWise's catalog yet.`
              : ""),
        );
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to import LeetCode progress",
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label
          htmlFor="leetcode-username"
          className="mb-1.5 block text-xs font-medium text-muted-foreground"
        >
          LeetCode username
        </label>
        <Input
          id="leetcode-username"
          name="leetcode-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. johndoe123"
          disabled={isPending}
          required
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
        Import
      </Button>
    </form>
  );
}
