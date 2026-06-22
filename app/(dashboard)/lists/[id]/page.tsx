import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getListDetail } from "@/lib/lists";
import { ProblemTable } from "@/components/problem-table";
import { RenameListForm } from "@/components/rename-list-form";
import { DeleteListButton } from "@/components/delete-list-button";
import { AddToListSearch } from "@/components/add-to-list-search";
import { ListProblemsRemove } from "@/components/list-problems-remove";

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user!.id!;
  const list = await getListDetail(id, userId);

  if (!list) notFound();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4 duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
        <div className="flex flex-col gap-1.5">
          <RenameListForm listId={list.id} name={list.name} />
          <p className="text-sm text-muted-foreground">
            {list.description || "No description"}
          </p>
          <p className="font-mono text-xs tabular-nums text-muted-foreground">
            {list.rows.length} {list.rows.length === 1 ? "problem" : "problems"}
          </p>
        </div>
        <DeleteListButton listId={list.id} listName={list.name} redirectAfter />
      </div>

      <AddToListSearch
        listId={list.id}
        existingProblemIds={list.rows.map((r) => r.problemId)}
      />

      <ProblemTable rows={list.rows} showFrequency={false} />

      <ListProblemsRemove
        listId={list.id}
        problems={list.rows.map((r) => ({ problemId: r.problemId, title: r.title }))}
      />
    </div>
  );
}
