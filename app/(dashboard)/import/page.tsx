import { Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LeetCodeImportForm } from "@/components/leetcode-import-form";

export default function ImportPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Import LeetCode Progress
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sync your recent solves from LeetCode in one click.
        </p>
      </div>

      <Card className="gap-4 p-6">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Download className="size-4" />
          <span className="label-mono">Import from LeetCode</span>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Imports your most recent accepted submissions from LeetCode &mdash; great for
          quickly syncing your latest activity. LeetCode&apos;s public API only exposes
          your last ~15-20 accepted submissions, so this won&apos;t backfill years of old
          history &mdash; but going forward, solving on AlgoWise directly is the best way
          to keep your record complete.
        </p>

        <LeetCodeImportForm />
      </Card>
    </div>
  );
}
