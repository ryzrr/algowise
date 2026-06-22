"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Trash2, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, avatarGradient } from "@/lib/utils";
import {
  postDiscussionComment,
  deleteDiscussionComment,
} from "@/actions/discussion-actions";
import type { DiscussionThread } from "@/lib/discussions";

type Author = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
};

function CommentAvatar({ author, size = "default" }: { author: Author; size?: "default" | "sm" }) {
  const label = author.name || author.username || "Anonymous";
  return (
    <Avatar size={size}>
      {author.image ? <AvatarImage src={author.image} alt={label} /> : null}
      <AvatarFallback
        className={cn("bg-gradient-to-br font-semibold text-foreground", avatarGradient(label))}
      >
        {label.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

function DeleteButton({ commentId, onDeleted }: { commentId: string; onDeleted: () => void }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteDiscussionComment(commentId);
      onDeleted();
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className="text-muted-foreground hover:text-destructive"
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      <span className="sr-only">Delete comment</span>
    </Button>
  );
}

function ReplyComposer({
  problemId,
  parentId,
  onPosted,
}: {
  problemId: string;
  parentId: string;
  onPosted: () => void;
}) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!content.trim() || isPending) return;
    startTransition(async () => {
      await postDiscussionComment(problemId, content, parentId);
      setContent("");
      onPosted();
    });
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a reply..."
        className="min-h-[70px] text-sm"
        disabled={isPending}
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={handleSubmit} disabled={isPending || !content.trim()}>
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Reply
        </Button>
      </div>
    </div>
  );
}

function ReplyItem({
  problemId,
  reply,
  currentUserId,
  onChanged,
}: {
  problemId: string;
  reply: DiscussionThread["replies"][number];
  currentUserId: string;
  onChanged: () => void;
}) {
  return (
    <div className="flex gap-3">
      <CommentAvatar author={reply.author} size="sm" />
      <div className="flex-1 rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {reply.author.name || reply.author.username || "Anonymous"}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(reply.createdAt, { addSuffix: true })}
            </span>
          </div>
          {reply.author.id === currentUserId ? (
            <DeleteButton commentId={reply.id} onDeleted={onChanged} />
          ) : null}
        </div>
        <p className="mt-1 text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
          {reply.content}
        </p>
      </div>
    </div>
  );
}

function ThreadItem({
  problemId,
  thread,
  currentUserId,
  onChanged,
}: {
  problemId: string;
  thread: DiscussionThread;
  currentUserId: string;
  onChanged: () => void;
}) {
  const [replying, setReplying] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex gap-3">
        <CommentAvatar author={thread.author} />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {thread.author.name || thread.author.username || "Anonymous"}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(thread.createdAt, { addSuffix: true })}
              </span>
            </div>
            {thread.author.id === currentUserId ? (
              <DeleteButton commentId={thread.id} onDeleted={onChanged} />
            ) : null}
          </div>
          <p className="mt-1 text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
            {thread.content}
          </p>
          <Button
            variant="ghost"
            size="xs"
            className="mt-2 text-muted-foreground"
            onClick={() => setReplying((v) => !v)}
          >
            Reply
          </Button>

          {replying ? (
            <ReplyComposer
              problemId={problemId}
              parentId={thread.id}
              onPosted={() => {
                setReplying(false);
                onChanged();
              }}
            />
          ) : null}
        </div>
      </div>

      {thread.replies.length > 0 ? (
        <div className="ml-6 flex flex-col gap-3 border-l border-border pl-4 sm:ml-11">
          {thread.replies.map((reply) => (
            <ReplyItem
              key={reply.id}
              problemId={problemId}
              reply={reply}
              currentUserId={currentUserId}
              onChanged={onChanged}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ProblemDiscussion({
  problemId,
  threads,
  currentUserId,
}: {
  problemId: string;
  threads: DiscussionThread[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  function handleSubmit() {
    if (!content.trim() || isPending) return;
    startTransition(async () => {
      await postDiscussionComment(problemId, content);
      setContent("");
      refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="flex items-center gap-2 text-xl font-heading font-semibold">
        <MessageSquare className="size-5" />
        Discussion
      </h2>

      <div className="flex flex-col gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your approach, ask for a hint, or discuss an edge case..."
          className="min-h-[100px]"
          disabled={isPending}
        />
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isPending || !content.trim()}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Post Comment
          </Button>
        </div>
      </div>

      {threads.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No discussion yet — be the first to share your approach.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {threads.map((thread) => (
            <ThreadItem
              key={thread.id}
              problemId={problemId}
              thread={thread}
              currentUserId={currentUserId}
              onChanged={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
