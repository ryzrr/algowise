"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteList } from "@/actions/list-actions";

export function DeleteListButton({
  listId,
  listName,
  redirectAfter = false,
}: {
  listId: string;
  listName: string;
  redirectAfter?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteList(listId);
      setOpen(false);
      if (redirectAfter) router.push("/lists");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          />
        }
      >
        <Trash2 className="size-4" />
        <span className="sr-only">Delete list</span>
      </DialogTrigger>
      <DialogContent onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Delete &quot;{listName}&quot;?</DialogTitle>
          <DialogDescription>
            This will permanently delete this list and remove all problems from it. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete list"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
