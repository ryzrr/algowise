"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { withdrawFeedbackRequest } from "@/actions/mentor-actions";

export function WithdrawFeedbackButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        await withdrawFeedbackRequest(requestId);
        toast.success("Request withdrawn");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to withdraw request");
      }
    });
  }

  return (
    <Button variant="ghost" size="xs" className="text-muted-foreground hover:text-destructive" onClick={handleClick} disabled={isPending}>
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
      Withdraw
    </Button>
  );
}
