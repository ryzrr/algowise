import { auth } from "@/lib/auth";
import { getRevisionList } from "@/lib/data";
import { ProblemTable, type ProblemRow } from "@/components/problem-table";
import { DueReviewPanel } from "@/components/due-review-panel";

export default async function RevisionPage() {
  const session = await auth();
  const items = await getRevisionList(session!.user!.id!);

  const dueItems = items
    .filter((i) => i.due)
    .map((i) => ({ problemId: i.problemId, title: i.title, link: i.link, difficulty: i.difficulty }));

  const rows: ProblemRow[] = items.map((i) => ({
    problemId: i.problemId,
    title: i.company ? `${i.title} (${i.company.name})` : i.title,
    link: i.link,
    difficulty: i.difficulty,
    isPaidOnly: false,
    status: i.status as "TODO" | "SOLVED",
    starred: true,
    note: i.note,
  }));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div className="duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Revision</h1>
        <p className="text-sm text-muted-foreground">
          Problems you&apos;ve starred for a second pass, scheduled with spaced repetition —
          soonest due first.
        </p>
      </div>

      <DueReviewPanel items={dueItems} />

      <ProblemTable rows={rows} showFrequency={false} />
    </div>
  );
}
