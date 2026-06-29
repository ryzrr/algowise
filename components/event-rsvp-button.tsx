"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CalendarCheck, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { rsvpToEvent } from "@/actions/event-actions";

export function EventRsvpButton({
  eventId,
  joined,
  className,
}: {
  eventId: string;
  joined: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await rsvpToEvent(eventId);
      if (result.full) {
        toast.error("This event is full");
      } else {
        toast.success(result.joined ? "You're in!" : "RSVP removed");
        router.refresh();
      }
    });
  }

  return (
    <Button
      variant={joined ? "outline" : "default"}
      onClick={handleClick}
      disabled={isPending}
      className={className}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : joined ? (
        <CalendarCheck className="size-4" />
      ) : (
        <CalendarPlus className="size-4" />
      )}
      {joined ? "Going" : "RSVP"}
    </Button>
  );
}
