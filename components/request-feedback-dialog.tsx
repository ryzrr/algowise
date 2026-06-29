"use client";

import { useState, useTransition } from "react";
import { MessageCircleQuestion, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createFeedbackRequest } from "@/actions/mentor-actions";

export function RequestFeedbackDialog({ mentorId, mentorName }: { mentorId: string; mentorName: string }) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSend() {
    if (!topic.trim() || !message.trim()) {
      toast.error("Topic and message are required");
      return;
    }
    startTransition(async () => {
      try {
        await createFeedbackRequest(mentorId, { topic, message });
        toast.success("Feedback request sent");
        setOpen(false);
        setTopic("");
        setMessage("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to send request");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setTopic("");
          setMessage("");
        }
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <MessageCircleQuestion className="size-4" />
        Request Feedback
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request feedback from {mentorName}</DialogTitle>
          <DialogDescription>
            Write your ask once — {mentorName} will reply with a single written response.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Topic</label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Mock interview feedback for Amazon SDE2"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What you'd like feedback on, what you've tried, and any relevant links..."
              className="min-h-[120px]"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={handleSend} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
