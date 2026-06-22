"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Swords, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createRoom } from "@/actions/war-room-actions";

export function StartDuelButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleStart() {
    setPending(true);
    try {
      const code = await createRoom();
      router.push(`/war-room/${code}`);
    } catch {
      toast.error("Couldn't start a duel. Please try again.");
      setPending(false);
    }
  }

  return (
    <Button size="lg" onClick={handleStart} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Swords />}
      {pending ? "Starting duel…" : "Start a duel"}
    </Button>
  );
}
