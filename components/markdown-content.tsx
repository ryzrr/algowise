import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const PROSE_BASE =
  "prose prose-invert max-w-none prose-headings:font-heading prose-headings:font-bold prose-pre:bg-black/60 prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-a:text-primary prose-code:text-primary prose-code:bg-primary/10 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-blockquote:border-primary prose-blockquote:bg-accent/30 prose-blockquote:rounded-r-lg prose-img:rounded-xl prose-img:border prose-img:border-border";

export function MarkdownContent({
  content,
  className,
  size = "default",
}: {
  content: string;
  className?: string;
  size?: "default" | "sm";
}) {
  return (
    <div className={cn(PROSE_BASE, size === "sm" && "prose-sm", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
