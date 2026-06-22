"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { setInterviewTarget, clearInterviewTarget } from "@/actions/interview-target-actions";

export type InterviewTargetView = {
  companyName: string;
  companySlug: string;
  targetDate: string;
  daysRemaining: number;
  solved: number;
  total: number;
  goal: number;
  remaining: number;
  requiredPace: number;
  currentPace: number;
  onPace: boolean;
};

export function InterviewCountdownWidget({
  companySlug,
  companyName,
  target,
}: {
  companySlug: string;
  companyName: string;
  target: InterviewTargetView | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(target?.targetDate.slice(0, 10) ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!date) {
      toast.error("Pick a target date");
      return;
    }
    startTransition(async () => {
      await setInterviewTarget(companySlug, date);
      setOpen(false);
      toast.success(`Countdown set for ${companyName}`);
      router.refresh();
    });
  }

  function handleClear() {
    startTransition(async () => {
      await clearInterviewTarget(companySlug);
      toast.success("Countdown removed");
      router.refresh();
    });
  }

  if (!target) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          <CalendarClock className="size-4" />
          Set interview date
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Interview countdown for {companyName}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="target-date" className="text-xs font-medium text-muted-foreground">
              Target interview date
            </label>
            <Input
              id="target-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : "Set countdown"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <CalendarClock className="size-4 text-primary" />
        <span className="font-mono text-sm">
          <span className={cn("font-bold", target.daysRemaining <= 7 && "text-rose-400")}>
            {target.daysRemaining}
          </span>{" "}
          day{target.daysRemaining === 1 ? "" : "s"} to {companyName}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          Need <span className="font-mono font-semibold text-foreground">{target.requiredPace}</span>/day
        </span>
        <span>·</span>
        <span className={cn(target.onPace ? "text-emerald-400" : "text-amber-400")}>
          doing {target.currentPace}/day
        </span>
      </div>
      <Progress value={(target.solved / Math.max(1, target.goal)) * 100} className="h-1.5 w-24" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="ghost" size="sm" />}>Edit</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Interview countdown for {companyName}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="target-date-edit" className="text-xs font-medium text-muted-foreground">
              Target interview date
            </label>
            <Input
              id="target-date-edit"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Button variant="ghost" size="icon" className="size-7" onClick={handleClear} disabled={isPending}>
        <X className="size-4" />
      </Button>
    </div>
  );
}
