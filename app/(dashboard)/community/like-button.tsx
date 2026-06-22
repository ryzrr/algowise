"use client";

import { useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleLike } from "./actions";
import { cn } from "@/lib/utils";

export function LikeButton({
  postId,
  liked,
  count,
}: {
  postId: string;
  liked: boolean;
  count: number;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => toggleLike(postId))}
      disabled={isPending}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all",
        liked
          ? "border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
          : "border-border bg-card text-muted-foreground hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400",
        isPending && "opacity-60 cursor-not-allowed"
      )}
    >
      <Heart
        className={cn("size-4 transition-transform", liked && "fill-rose-400", isPending && "scale-110")}
      />
      <span>{count} {count === 1 ? "like" : "likes"}</span>
    </button>
  );
}
