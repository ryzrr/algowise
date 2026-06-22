import { notFound } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageSquare, ArrowLeft, Eye, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { createComment, markPostViewed } from "../actions";
import { LikeButton } from "../like-button";
import { cn } from "@/lib/utils";

function readingTime(text: string) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default async function PostViewerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      author: { select: { name: true, image: true, id: true } },
      comments: {
        include: { author: { select: { name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { likes: true } },
      likes: session?.user?.id
        ? { where: { userId: session.user.id } }
        : false,
      tags: { include: { tag: true } },
    },
  });

  if (!post) notFound();

  // Only increment views once per user per post per 24 hours using a cookie
  const cookieStore = await cookies();
  const viewedKey = `viewed_${post.id}`;
  const alreadyViewed = cookieStore.has(viewedKey);

  if (!alreadyViewed) {
    prisma.post.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    }).catch(() => {});
    // Set the cookie so subsequent visits within 24h are not counted
    markPostViewed(post.id).catch(() => {});
  }

  const isLiked = session?.user?.id
    ? (post.likes as { userId: string }[]).length > 0
    : false;

  const mins = readingTime(post.content);

  return (
    <div className="min-h-full bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link
            href="/community"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Community
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 flex gap-8">
        {/* Like sidebar (desktop) */}
        <aside className="hidden lg:flex flex-col items-center gap-4 pt-8 w-14 shrink-0">
          <LikeButton postId={post.id} liked={isLiked} count={post._count.likes} />
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <MessageSquare className="size-5" />
            <span className="text-sm">{post.comments.length}</span>
          </div>
        </aside>

        {/* Main article */}
        <article className="flex-1 min-w-0">
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Article header */}
            <div className="px-8 pt-10 pb-8 border-b border-border">
              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-muted-foreground"
                    >
                      #{tag.slug}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-foreground leading-tight">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mt-6">
                <div className="flex items-center gap-3">
                  {post.author.image ? (
                    <img
                      src={post.author.image}
                      alt={post.author.name || ""}
                      className="size-10 rounded-full ring-2 ring-border"
                    />
                  ) : (
                    <div className="size-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 ring-2 ring-border flex items-center justify-center font-bold text-primary">
                      {(post.author.name || "A").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">{post.author.name || "Anonymous"}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {format(post.createdAt, "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {mins} min read
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="size-3" />
                        {post.views} views
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Article body */}
            <div className="px-8 py-10">
              <div className="prose prose-invert max-w-none prose-headings:font-heading prose-headings:font-bold prose-pre:bg-black/60 prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-a:text-primary prose-code:text-primary prose-code:bg-primary/10 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-blockquote:border-primary prose-blockquote:bg-accent/30 prose-blockquote:rounded-r-lg prose-img:rounded-xl prose-img:border prose-img:border-border">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {post.content}
                </ReactMarkdown>
              </div>
            </div>

            {/* Article footer - like/share on mobile */}
            <div className="px-8 py-6 border-t border-border bg-accent/20 flex items-center gap-3 lg:hidden">
              <LikeButton postId={post.id} liked={isLiked} count={post._count.likes} />
            </div>
          </div>

          {/* Author bio card */}
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 flex gap-4">
            {post.author.image ? (
              <img src={post.author.image} alt="" className="size-14 rounded-full ring-2 ring-border shrink-0" />
            ) : (
              <div className="size-14 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 ring-2 ring-border flex items-center justify-center font-bold text-xl text-primary shrink-0">
                {(post.author.name || "A").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-heading font-semibold text-lg">{post.author.name || "Anonymous"}</p>
              <p className="text-sm text-muted-foreground mt-1">
                AlgoWise community member. Sharing interview experiences and algorithm insights.
              </p>
            </div>
          </div>

          {/* Comments section */}
          <div id="comments" className="mt-8">
            <h3 className="text-xl font-heading font-semibold flex items-center gap-2 mb-6">
              <MessageSquare className="size-5" />
              {post.comments.length} Comment{post.comments.length !== 1 ? "s" : ""}
            </h3>

            {/* Comment form */}
            {session?.user ? (
              <form action={createComment.bind(null, post.id)} className="flex gap-4 mb-8">
                {session.user.image ? (
                  <img src={session.user.image} alt="" className="size-10 rounded-full shrink-0 ring-2 ring-border" />
                ) : (
                  <div className="size-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 shrink-0 ring-2 ring-border flex items-center justify-center font-bold text-primary">
                    {(session.user.name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col gap-2 flex-1">
                  <textarea
                    name="content"
                    placeholder="Share your thoughts..."
                    className="w-full resize-y min-h-[100px] rounded-xl border border-border bg-card p-4 text-sm shadow-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
                    required
                  />
                  <div className="flex justify-end">
                    <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
                      Post Comment
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mb-8 p-4 rounded-xl border border-border bg-accent/30 text-sm text-muted-foreground text-center">
                <Link href="/login" className="text-primary hover:underline">Sign in</Link> to join the discussion.
              </div>
            )}

            {/* Comments list */}
            <div className="flex flex-col gap-5">
              {post.comments.map((comment) => (
                <div key={comment.id} className="flex gap-4">
                  {comment.author.image ? (
                    <img src={comment.author.image} alt="" className="size-10 rounded-full shrink-0 ring-2 ring-border" />
                  ) : (
                    <div className="size-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 shrink-0 ring-2 ring-border flex items-center justify-center font-bold text-primary">
                      {(comment.author.name || "A").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm">{comment.author.name || "Anonymous"}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        {/* Right sidebar (desktop) */}
        <aside className="hidden xl:flex flex-col gap-4 w-64 shrink-0">
          <div className="rounded-xl border border-border bg-card p-5 sticky top-20">
            <h3 className="font-heading font-semibold mb-3">Table of Contents</h3>
            <p className="text-xs text-muted-foreground">
              Jump links will appear here for long posts with headings.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
