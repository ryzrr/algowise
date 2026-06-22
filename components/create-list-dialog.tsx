"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createList } from "@/actions/list-actions";

export function CreateListDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("List name is required");
      return;
    }
    setError(null);
    startTransition(async () => {
      const listId = await createList(trimmed, description.trim() || undefined);
      setOpen(false);
      setName("");
      setDescription("");
      router.push(`/lists/${listId}`);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setName("");
          setDescription("");
          setError(null);
        }
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        New list
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new list</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="list-name" className="text-xs font-medium text-muted-foreground">
              Name
            </label>
            <Input
              id="list-name"
              placeholder="Blind 75"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="list-description" className="text-xs font-medium text-muted-foreground">
              Description (optional)
            </label>
            <Input
              id="list-description"
              placeholder="A curated set of must-know problems"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleCreate} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create list"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
