"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { respondToFeedbackRequest } from "@/actions/mentor-actions";

export function RespondFeedbackForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [response, setResponse] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!response.trim()) return;
    startTransition(async () => {
      try {
        await respondToFeedbackRequest(requestId, response);
        toast.success("Response sent");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to send response");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Write your feedback..."
        className="min-h-[90px] text-sm"
        disabled={isPending}
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={handleSubmit} disabled={isPending || !response.trim()}>
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          Send response
        </Button>
      </div>
    </div>
  );
}
