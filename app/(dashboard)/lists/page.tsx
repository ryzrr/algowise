import Link from "next/link";
import { ListChecks } from "lucide-react";
import { auth } from "@/lib/auth";
import { getUserLists } from "@/lib/lists";
import { Card } from "@/components/ui/card";
import { CreateListDialog } from "@/components/create-list-dialog";
import { DeleteListButton } from "@/components/delete-list-button";

export default async function ListsPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const lists = await getUserLists(userId);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Lists</h1>
          <p className="text-sm text-muted-foreground">
            Custom collections of problems to track your own prep plan.
          </p>
        </div>
        <CreateListDialog />
      </div>

      {lists.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <ListChecks className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            You don&apos;t have any lists yet. Create one to start curating problems.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list, i) => (
            <Link
              key={list.id}
              href={`/lists/${list.id}`}
              className="duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
              style={{ animationDelay: `${Math.min(i * 30, 360)}ms` }}
            >
              <Card className="group relative flex h-full flex-col gap-3 p-5 transition-all hover:-translate-y-1 hover:ring-white/20 active:translate-y-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-heading text-base font-semibold tracking-tight">
                    {list.name}
                  </p>
                  <DeleteListButton listId={list.id} listName={list.name} />
                </div>

                {list.description ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {list.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground/60 italic">No description</p>
                )}

                <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
                  <span className="font-mono tabular-nums">
                    {list.problemCount} {list.problemCount === 1 ? "problem" : "problems"}
                  </span>
                  <span>
                    {new Date(list.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
