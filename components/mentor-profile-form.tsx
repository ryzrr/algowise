"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { updateMentorProfile } from "@/actions/mentor-actions";

export function MentorProfileForm({
  initial,
}: {
  initial: {
    isMentor: boolean;
    mentorTitle: string | null;
    mentorCompany: string | null;
    mentorBio: string | null;
    mentorYears: number | null;
  };
}) {
  const router = useRouter();
  const [isMentor, setIsMentor] = useState(initial.isMentor);
  const [title, setTitle] = useState(initial.mentorTitle ?? "");
  const [company, setCompany] = useState(initial.mentorCompany ?? "");
  const [bio, setBio] = useState(initial.mentorBio ?? "");
  const [years, setYears] = useState(initial.mentorYears ? String(initial.mentorYears) : "");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateMentorProfile({
          isMentor,
          mentorTitle: title,
          mentorCompany: company,
          mentorBio: bio,
          mentorYears: years ? Number(years) : undefined,
        });
        toast.success("Mentor profile updated");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update mentor profile");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex items-center gap-2.5 text-sm">
        <Checkbox checked={isMentor} onCheckedChange={(c) => setIsMentor(!!c)} />
        I want to be listed as a mentor and offer feedback to others
      </label>

      {isMentor && (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Senior SDE" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Company</label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Google" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Years of experience <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <Input type="number" min={1} value={years} onChange={(e) => setYears(e.target.value)} className="max-w-32" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Bio <span className="text-muted-foreground/60">(optional, Markdown supported)</span>
            </label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What you can help with, your interview experience, areas of focus..."
              className="min-h-[100px]"
            />
          </div>
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Save mentor profile
      </Button>
    </form>
  );
}
