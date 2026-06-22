"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { renameList } from "@/actions/list-actions";

export function RenameListForm({ listId, name }: { listId: string; name: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === name) {
      setEditing(false);
      setValue(name);
      return;
    }
    startTransition(async () => {
      await renameList(listId, trimmed);
      setEditing(false);
      router.refresh();
    });
  }

  function handleCancel() {
    setValue(name);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="group flex items-center gap-2 text-left"
      >
        <h1 className="font-heading text-3xl font-bold tracking-tight">{name}</h1>
        <Pencil className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        className="max-w-sm text-lg font-semibold"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") handleCancel();
        }}
        disabled={isPending}
      />
      <Button size="icon-sm" variant="ghost" onClick={handleSave} disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
      </Button>
      <Button size="icon-sm" variant="ghost" onClick={handleCancel} disabled={isPending}>
        <X className="size-4" />
      </Button>
    </div>
  );
}
