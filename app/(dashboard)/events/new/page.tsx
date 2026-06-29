"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createEvent } from "@/actions/event-actions";
import type { EventCategory } from "@prisma/client";

const CATEGORY_LABEL: Record<EventCategory, string> = {
  PREP: "Prep",
  SKILLS: "Skills",
  INTERVIEW_PREP: "Interview Prep",
};

export default function NewEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<EventCategory>("PREP");
  const [startAt, setStartAt] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [capacity, setCapacity] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !startAt) {
      toast.error("Title, description, and date/time are required");
      return;
    }
    startTransition(async () => {
      try {
        const eventId = await createEvent({
          title,
          description,
          category,
          startAt,
          externalLink: externalLink.trim() || undefined,
          capacity: capacity ? Number(capacity) : undefined,
        });
        toast.success("Event created");
        router.push(`/events/${eventId}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create event");
      }
    });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 p-6">
      <div>
        <Link href="/events" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Events
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight">Create an event</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up a mock interview, study session, or skill workshop for the community to join.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mock interview practice — Arrays & Strings"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will happen, who it's for, what to prepare (Markdown supported)..."
              className="min-h-[120px]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EventCategory)}
                  className="h-8 w-full appearance-none rounded-lg border border-input bg-transparent pl-2.5 pr-7 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {(Object.keys(CATEGORY_LABEL) as EventCategory[]).map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Date & time</label>
              <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                External link <span className="text-muted-foreground/60">(optional)</span>
              </label>
              <Input
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://meet.google.com/..."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Capacity <span className="text-muted-foreground/60">(optional)</span>
              </label>
              <Input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/events" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </Link>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Create event
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
