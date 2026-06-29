"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Pencil, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateEvent } from "@/actions/event-actions";
import type { EventCategory } from "@prisma/client";

const CATEGORY_LABEL: Record<EventCategory, string> = {
  PREP: "Prep",
  SKILLS: "Skills",
  INTERVIEW_PREP: "Interview Prep",
};

export function EditEventDialog({
  eventId,
  initial,
}: {
  eventId: string;
  initial: {
    title: string;
    description: string;
    category: EventCategory;
    startAt: Date;
    externalLink: string | null;
    capacity: number | null;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [category, setCategory] = useState<EventCategory>(initial.category);
  const [startAt, setStartAt] = useState(format(initial.startAt, "yyyy-MM-dd'T'HH:mm"));
  const [externalLink, setExternalLink] = useState(initial.externalLink ?? "");
  const [capacity, setCapacity] = useState(initial.capacity ? String(initial.capacity) : "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!title.trim() || !description.trim() || !startAt) {
      toast.error("Title, description, and date/time are required");
      return;
    }
    startTransition(async () => {
      try {
        await updateEvent(eventId, {
          title,
          description,
          category,
          startAt,
          externalLink: externalLink.trim() || undefined,
          capacity: capacity ? Number(capacity) : undefined,
        });
        toast.success("Event updated");
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update event");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Pencil className="size-4" />
        Edit
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit event</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[100px]" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
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

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">External link</label>
              <Input value={externalLink} onChange={(e) => setExternalLink(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Capacity</label>
              <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Unlimited" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
