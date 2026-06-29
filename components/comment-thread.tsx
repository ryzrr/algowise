"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, avatarGradient } from "@/lib/utils";
import {
  createComment,
  deleteComment,
  acceptAnswer,
  unacceptAnswer,
} from "@/app/(dashboard)/community/actions";

type CommentAuthor = { id: string; name: string | null; image: string | null };
type ReplyData = { id: string; content: string; createdAt: Date; author: CommentAuthor };
type ThreadData = {
  id: string;
  content: string;
  createdAt: Date;
  author: CommentAuthor;
  replies: ReplyData[];
};

function CommentAvatar({ author, size = "default" }: { author: CommentAuthor; size?: "default" | "sm" }) {
  const label = author.name || "Anonymous";
  return (
    <Avatar size={size}>
      {author.image ? <AvatarImage src={author.image} alt={label} /> : null}
      <AvatarFallback className={cn("bg-gradient-to-br font-semibold text-foreground", avatarGradient(label))}>
        {label.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

function DeleteButton({ commentId, onDeleted }: { commentId: string; onDeleted: () => void }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteComment(commentId);
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

function AcceptButton({
  postId,
  commentId,
  accepted,
  onChanged,
}: {
  postId: string;
  commentId: string;
  accepted: boolean;
  onChanged: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      if (accepted) {
        await unacceptAnswer(postId);
      } else {
        await acceptAnswer(postId, commentId);
      }
      onChanged();
    });
  }

  return (
    <Button
      variant={accepted ? "default" : "outline"}
      size="xs"
      className={cn("gap-1.5", accepted && "bg-emerald-600 hover:bg-emerald-600/90")}
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
      {accepted ? "Accepted" : "Accept answer"}
    </Button>
  );
}

function ReplyComposer({
  postId,
  parentId,
  onPosted,
}: {
  postId: string;
  parentId: string;
  onPosted: () => void;
}) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!content.trim() || isPending) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("content", content);
      await createComment(postId, fd, parentId);
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

function ReplyItem({ reply, currentUserId, onChanged }: {
  reply: ReplyData;
  currentUserId: string | null;
  onChanged: () => void;
}) {
  return (
    <div className="flex gap-3">
      <CommentAvatar author={reply.author} size="sm" />
      <div className="flex-1 rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{reply.author.name || "Anonymous"}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(reply.createdAt, { addSuffix: true })}
            </span>
          </div>
          {reply.author.id === currentUserId ? (
            <DeleteButton commentId={reply.id} onDeleted={onChanged} />
          ) : null}
        </div>
        <p className="mt-1 text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">{reply.content}</p>
      </div>
    </div>
  );
}

function ThreadItem({
  postId,
  thread,
  currentUserId,
  isQuestion,
  acceptedCommentId,
  canAccept,
  onChanged,
}: {
  postId: string;
  thread: ThreadData;
  currentUserId: string | null;
  isQuestion: boolean;
  acceptedCommentId: string | null;
  canAccept: boolean;
  onChanged: () => void;
}) {
  const [replying, setReplying] = useState(false);
  const accepted = acceptedCommentId === thread.id;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-4",
        accepted ? "border-emerald-500/40 ring-1 ring-emerald-500/20" : "border-border"
      )}
    >
      {accepted && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
          <CheckCircle2 className="size-3.5" />
          Accepted answer
        </div>
      )}
      <div className="flex gap-3">
        <CommentAvatar author={thread.author} />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{thread.author.name || "Anonymous"}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(thread.createdAt, { addSuffix: true })}
              </span>
            </div>
            {thread.author.id === currentUserId ? (
              <DeleteButton commentId={thread.id} onDeleted={onChanged} />
            ) : null}
          </div>
          <p className="mt-1 text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">{thread.content}</p>
          <div className="mt-2 flex items-center gap-2">
            <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={() => setReplying((v) => !v)}>
              Reply
            </Button>
            {isQuestion && canAccept && (
              <AcceptButton postId={postId} commentId={thread.id} accepted={accepted} onChanged={onChanged} />
            )}
          </div>

          {replying ? (
            <ReplyComposer
              postId={postId}
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
            <ReplyItem key={reply.id} reply={reply} currentUserId={currentUserId} onChanged={onChanged} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CommentThread({
  postId,
  threads,
  currentUser,
  isQuestion,
  acceptedCommentId,
  canAccept,
}: {
  postId: string;
  threads: ThreadData[];
  currentUser: CommentAuthor | null;
  isQuestion: boolean;
  acceptedCommentId: string | null;
  canAccept: boolean;
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
      const fd = new FormData();
      fd.append("content", content);
      await createComment(postId, fd);
      setContent("");
      refresh();
    });
  }

  const totalCount = threads.reduce((acc, t) => acc + 1 + t.replies.length, 0);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="flex items-center gap-2 text-xl font-heading font-semibold">
        <MessageSquare className="size-5" />
        {totalCount} {isQuestion ? (totalCount === 1 ? "Answer" : "Answers") : totalCount === 1 ? "Comment" : "Comments"}
      </h2>

      {currentUser ? (
        <div className="flex flex-col gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isQuestion ? "Write an answer..." : "Share your thoughts..."}
            className="min-h-[100px]"
            disabled={isPending}
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isPending || !content.trim()}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isQuestion ? "Post Answer" : "Post Comment"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-border bg-accent/30 text-sm text-muted-foreground text-center">
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>{" "}
          to join the discussion.
        </div>
      )}

      {threads.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {isQuestion ? "No answers yet — be the first to help." : "No comments yet."}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {threads.map((thread) => (
            <ThreadItem
              key={thread.id}
              postId={postId}
              thread={thread}
              currentUserId={currentUser?.id ?? null}
              isQuestion={isQuestion}
              acceptedCommentId={acceptedCommentId}
              canAccept={canAccept}
              onChanged={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
