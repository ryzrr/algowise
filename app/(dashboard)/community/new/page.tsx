"use client";

import { Suspense, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { Eye, Pencil, X, Loader2, HelpCircle, PencilLine } from "lucide-react";
import { createPost } from "../actions";
import { buttonVariants } from "@/components/ui/button";
import { MarkdownContent } from "@/components/markdown-content";
import { cn } from "@/lib/utils";
import Link from "next/link";

function SubmitButton({ isQuestion }: { isQuestion: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonVariants({ size: "sm" }), "gap-2 min-w-[120px]")}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Publishing...
        </>
      ) : isQuestion ? (
        "Post Question"
      ) : (
        "Publish Article"
      )}
    </button>
  );
}

export default function NewPostPage() {
  return (
    <Suspense>
      <NewPostForm />
    </Suspense>
  );
}

function NewPostForm() {
  const searchParams = useSearchParams();
  const isQuestion = searchParams.get("type") === "QUESTION";
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  function addTag() {
    const slug = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    if (slug && !tags.includes(slug) && tags.length < 5) {
      setTags([...tags, slug]);
    }
    setTagInput("");
  }

  return (
    <div className="min-h-full bg-background">
      {/* Editor Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/community" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Community
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="flex items-center gap-1.5 text-sm font-medium">
              {isQuestion ? <HelpCircle className="size-3.5" /> : <PencilLine className="size-3.5" />}
              {isQuestion ? "New Question" : "New Article"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-border p-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => setTab("write")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  tab === "write" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Pencil className="size-3" />
                Write
              </button>
              <button
                type="button"
                onClick={() => setTab("preview")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  tab === "preview" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Eye className="size-3" />
                Preview
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <form
          action={async (fd) => {
            // Inject tag values into formData
            tags.forEach((t) => fd.append("tags", t));
            await createPost(fd);
          }}
        >
          {/* Card wrapper */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Cover image area (optional visual) */}
            <div className="border-b border-border px-8 pt-8 pb-6">
              <input
                type="hidden"
                name="title"
                value={title}
              />
              <input
                type="hidden"
                name="content"
                value={content}
              />
              <input type="hidden" name="type" value={isQuestion ? "QUESTION" : "BLOG"} />

              <textarea
                placeholder={isQuestion ? "What's your question?" : "New post title here..."}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full resize-none bg-transparent text-3xl sm:text-4xl font-heading font-bold tracking-tight text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                rows={1}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = el.scrollHeight + "px";
                }}
              />

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent text-sm font-medium text-muted-foreground"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                      className="hover:text-foreground transition-colors ml-0.5"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                {tags.length < 5 && (
                  <input
                    type="text"
                    placeholder="Add up to 5 tags..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/40 focus:outline-none min-w-[150px]"
                  />
                )}
              </div>
            </div>

            {/* Editor body */}
            <div className="px-8 py-6 min-h-[460px]">
              {tab === "write" ? (
                <textarea
                  placeholder={
                    isQuestion
                      ? "Describe what you're stuck on or want to ask...\n\nInclude what you've tried, the problem link, and any error messages or edge cases."
                      : `Write your post content here in Markdown...\n\n## Example heading\n\nYour content here. You can use **bold**, _italic_, and \`code\` formatting.\n\n\`\`\`python\ndef two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i\n\`\`\``
                  }
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-full min-h-[420px] resize-none bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none leading-relaxed"
                />
              ) : content ? (
                <MarkdownContent content={content} />
              ) : (
                <p className="text-muted-foreground/50 italic">
                  Nothing to preview yet. Switch to Write and add some content.
                </p>
              )}
            </div>
          </div>

          {/* Toolbar below */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-muted-foreground">
              Markdown is supported. Press <kbd className="px-1.5 py-0.5 rounded border border-border text-xs font-mono">Enter</kbd> or <kbd className="px-1.5 py-0.5 rounded border border-border text-xs font-mono">,</kbd> to add tags.
            </p>
            <div className="flex items-center gap-3">
              <Link href="/community" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Discard
              </Link>
              <SubmitButton isQuestion={isQuestion} />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
