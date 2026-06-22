import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Eye, Heart, Plus, TrendingUp, Clock, Bookmark } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";

export default async function CommunityPage() {
  const session = await auth();

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true, image: true, id: true } },
      _count: { select: { comments: true, likes: true } },
      tags: { include: { tag: true } },
    },
  });

  const popularTags = [
    "Dynamic Programming", "Graph", "System Design", "Interview Experience",
    "Arrays", "Trees", "Google", "Amazon", "Tips & Tricks"
  ];

  return (
    <div className="min-h-full bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="font-heading font-bold text-lg">Community</h1>
            <nav className="hidden md:flex items-center gap-1">
              <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium bg-accent text-accent-foreground">
                <TrendingUp className="size-3.5" />
                Latest
              </button>
              <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                <Clock className="size-3.5" />
                Top
              </button>
            </nav>
          </div>
          <Link href="/community/new" className={cn(buttonVariants({ size: "sm" }), "gap-2 shadow-sm")}>
            <Plus className="size-4" />
            Write Post
          </Link>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-6xl mx-auto px-6 py-8 flex gap-8">
        {/* Feed */}
        <div className="flex-1 min-w-0">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-24 text-center">
              <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="size-8 text-primary" />
              </div>
              <h3 className="text-xl font-heading font-semibold">Nothing here yet</h3>
              <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-xs">
                Be the first to share your interview experience, algorithm insights, or ask the community.
              </p>
              <Link href="/community/new" className={buttonVariants()}>
                Write the first post
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="group relative flex gap-4 rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
                >
                  {/* Author avatar */}
                  <div className="hidden sm:flex shrink-0 flex-col items-center gap-2 pt-0.5">
                    {post.author.image ? (
                      <img
                        src={post.author.image}
                        alt={post.author.name || ""}
                        className="size-10 rounded-full ring-2 ring-border group-hover:ring-primary/30 transition-all"
                      />
                    ) : (
                      <div className="size-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 ring-2 ring-border flex items-center justify-center font-bold text-primary text-sm">
                        {(post.author.name || "A").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span className="font-semibold text-foreground text-sm">
                        {post.author.name || "Anonymous"}
                      </span>
                      <span>·</span>
                      <span>{formatDistanceToNow(post.createdAt, { addSuffix: true })}</span>
                    </div>

                    <Link href={`/community/${post.slug}`} className="block group/title mb-3">
                      <h2 className="text-xl font-heading font-bold tracking-tight text-foreground group-hover/title:text-primary transition-colors leading-snug">
                        {post.title}
                      </h2>
                    </Link>

                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.tags.map(({ tag }) => (
                          <span
                            key={tag.id}
                            className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-colors cursor-pointer"
                          >
                            #{tag.slug}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-auto pt-2">
                      <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-rose-400 transition-colors group/like">
                        <Heart className="size-4 group-hover/like:fill-rose-400 transition-colors" />
                        <span>{post._count.likes}</span>
                      </button>
                      <Link
                        href={`/community/${post.slug}#comments`}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <MessageSquare className="size-4" />
                        <span>{post._count.comments} comment{post._count.comments !== 1 ? "s" : ""}</span>
                      </Link>
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground ml-auto">
                        <Eye className="size-4" />
                        <span>{post.views}</span>
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="hidden lg:flex flex-col gap-4 w-72 shrink-0">
          {/* Write prompt */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-heading font-semibold mb-2">Share Your Knowledge</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Write about your interview experience, explain an algorithm, or share a tip with the community.
            </p>
            <Link href="/community/new" className={cn(buttonVariants({ size: "sm" }), "w-full gap-2")}>
              <Plus className="size-4" />
              Create Post
            </Link>
          </div>

          {/* Popular Tags */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-heading font-semibold mb-4"># Popular Tags</h3>
            <div className="flex flex-col gap-1">
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-left"
                >
                  <span className="text-primary font-bold">#</span>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-heading font-semibold mb-4">Community Stats</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Posts</span>
                <span className="font-semibold tabular-nums">{posts.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Comments</span>
                <span className="font-semibold tabular-nums">
                  {posts.reduce((acc, p) => acc + p._count.comments, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Likes</span>
                <span className="font-semibold tabular-nums">
                  {posts.reduce((acc, p) => acc + p._count.likes, 0)}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
