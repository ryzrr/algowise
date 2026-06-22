"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateUsername } from "@/actions/user-actions";

export function UsernameForm({ initialUsername }: { initialUsername: string | null }) {
  const [value, setValue] = useState(initialUsername ?? "");
  const [savedUsername, setSavedUsername] = useState(initialUsername);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const result = await updateUsername(value);
        setSavedUsername(result.username);
        setValue(result.username);
        toast.success("Username updated");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update username");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Username
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">algowise.app/u/</span>
            <Input
              id="username"
              name="username"
              value={value}
              onChange={(e) => setValue(e.target.value.toLowerCase())}
              placeholder="your-handle"
              maxLength={20}
              disabled={isPending}
              required
            />
          </div>
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Save
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        3-20 characters. Lowercase letters, digits, and hyphens only. Must start with a letter.
      </p>

      {savedUsername && (
        <Link
          href={`/u/${savedUsername}`}
          target="_blank"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit gap-1.5")}
        >
          View public profile
          <ExternalLink className="size-3.5" />
        </Link>
      )}
    </div>
  );
}
