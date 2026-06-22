"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startStorySessionAction } from "@/actions/story-mode-actions";

export function StartStoryButton({ companySlug }: { companySlug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    try {
      const sessionId = await startStorySessionAction(companySlug);
      router.push(`/story-mode/${sessionId}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleStart} disabled={loading} className="w-full">
      {loading ? <Loader2 className="animate-spin" /> : <Play />}
      Start Story Mode
    </Button>
  );
}
