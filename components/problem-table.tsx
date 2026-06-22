"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { ExternalLink, Star, Lock, NotebookPen, Eye, Pencil, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Checkbox } from "@/components/ui/checkbox";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleSolved, toggleStar, setNote } from "@/actions/problem-actions";

export type ProblemRow = {
  problemId: string;
  title: string;
  link: string;
  difficulty: string;
  frequency?: number;
  isPaidOnly: boolean;
  status: "TODO" | "SOLVED";
  starred: boolean;
  note: string;
};

export function ProblemTable({
  rows,
  companySlug,
  showFrequency = true,
  focusId,
}: {
  rows: ProblemRow[];
  companySlug?: string;
  showFrequency?: boolean;
  focusId?: string;
}) {
  const maxFrequency = Math.max(1, ...rows.map((r) => r.frequency ?? 0));
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
            <th className="w-12 px-4 py-3">Done</th>
            <th className="px-4 py-3">Problem</th>
            <th className="w-28 px-4 py-3">Difficulty</th>
            {showFrequency && <th className="w-24 px-4 py-3">Frequency</th>}
            <th className="w-16 px-4 py-3">Note</th>
            <th className="w-16 px-4 py-3">Star</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <ProblemRowItem
              key={row.problemId}
              row={row}
              companySlug={companySlug}
              showFrequency={showFrequency}
              maxFrequency={maxFrequency}
              index={i}
              focused={row.problemId === focusId}
            />
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">No problems here.</p>
      )}
    </div>
  );
}

function ProblemRowItem({
  row,
  companySlug,
  showFrequency,
  maxFrequency,
  index,
  focused,
}: {
  row: ProblemRow;
  companySlug?: string;
  showFrequency: boolean;
  maxFrequency: number;
  index: number;
  focused?: boolean;
}) {
  const rowRef = useRef<HTMLTableRowElement>(null);
  const [highlight, setHighlight] = useState(!!focused);

  useEffect(() => {
    if (focused && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      const timeout = setTimeout(() => setHighlight(false), 2200);
      return () => clearTimeout(timeout);
    }
  }, [focused]);
  const [solved, setSolved] = useState(row.status === "SOLVED");
  const [starred, setStarred] = useState(row.starred);
  const [note, setNoteText] = useState(row.note);
  const [previewMode, setPreviewMode] = useState(false);
  const [, startTransition] = useTransition();

  function handleToggleSolved(checked: boolean) {
    setSolved(checked);
    if (checked) {
      confetti({
        particleCount: 60,
        spread: 55,
        origin: { y: 0.7 },
        scalar: 0.7,
        ticks: 150,
      });
      toast.success(`Solved: ${row.title}`);
    }
    startTransition(async () => {
      await toggleSolved(row.problemId, companySlug);
    });
  }

  function handleToggleStar() {
    const next = !starred;
    setStarred(next);
    startTransition(async () => {
      await toggleStar(row.problemId, companySlug);
    });
  }

  function handleNoteBlur() {
    startTransition(async () => {
      await setNote(row.problemId, note, companySlug);
    });
  }

  return (
    <tr
      ref={rowRef}
      style={{ animationDelay: `${Math.min(index * 18, 360)}ms` }}
      className={cn(
        "border-b border-border/60 transition-colors duration-300 animate-in fade-in fill-mode-both last:border-0 hover:bg-muted/30",
        solved && "bg-emerald-500/10 hover:bg-emerald-500/20",
        highlight && "bg-primary/15 ring-1 ring-inset ring-primary/40"
      )}
    >
      <td className="px-4 py-3">
        <Checkbox checked={solved} onCheckedChange={(c) => handleToggleSolved(!!c)} />
      </td>
      <td className="px-4 py-3">
        <a
          href={row.link}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-1.5 font-medium hover:underline"
          )}
        >
          {row.title}
          <ExternalLink className="size-3 opacity-50" />
          {row.isPaidOnly && <Lock className="size-3 text-amber-400" />}
        </a>
        <Link
          href={`/problems/${row.problemId}`}
          className="ml-1.5 inline-flex items-center text-muted-foreground/60 transition-colors hover:text-primary"
          title="Discussion"
        >
          <MessageSquare className="size-3.5" />
        </Link>
      </td>
      <td className="px-4 py-3">
        <DifficultyBadge difficulty={row.difficulty} />
      </td>
      {showFrequency && (
        <td className="px-4 py-3">
          {row.frequency != null ? (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/60"
                  style={{ width: `${Math.max(8, (row.frequency / maxFrequency) * 100)}%` }}
                />
              </div>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {row.frequency}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>
      )}
      <td className="px-4 py-3">
        <Popover>
          <PopoverTrigger render={<Button variant="ghost" size="icon" className="size-7" />}>
            <NotebookPen className={cn("size-4", note && "text-primary")} />
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="mb-2 flex items-center justify-between">
              <span className="label-mono text-[10px]">Note (Markdown)</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => setPreviewMode((p) => !p)}
                type="button"
              >
                {previewMode ? <Pencil className="size-3.5" /> : <Eye className="size-3.5" />}
              </Button>
            </div>
            {previewMode ? (
              <div className="prose prose-sm dark:prose-invert min-h-24 max-h-64 overflow-y-auto rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                {note ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{note}</ReactMarkdown>
                ) : (
                  <span className="text-muted-foreground">Nothing to preview yet.</span>
                )}
              </div>
            ) : (
              <Textarea
                placeholder="Add a note for this problem... (Markdown supported)"
                value={note}
                onChange={(e) => setNoteText(e.target.value)}
                onBlur={handleNoteBlur}
                rows={4}
              />
            )}
          </PopoverContent>
        </Popover>
      </td>
      <td className="px-4 py-3">
        <Button variant="ghost" size="icon" className="size-7" onClick={handleToggleStar}>
          <motion.span
            animate={{ scale: starred ? [1, 1.35, 1] : 1, rotate: starred ? [0, -12, 0] : 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <Star className={cn("size-4", starred && "fill-amber-400 text-amber-400")} />
          </motion.span>
        </Button>
      </td>
    </tr>
  );
}
