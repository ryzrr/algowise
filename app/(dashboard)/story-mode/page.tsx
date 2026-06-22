import { Briefcase, Phone, Building2, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StartStoryButton } from "@/components/start-story-button";

const STAGE_PREVIEW = [
  { icon: Phone, label: "Recruiter Screen", detail: "2 Easy · 15 min" },
  { icon: Building2, label: "Phone Screen", detail: "1 Medium · 30 min" },
  { icon: Briefcase, label: "Onsite Round 1", detail: "2 Mixed · 45 min" },
  { icon: Trophy, label: "Onsite Round 2", detail: "1 Hard · 45 min" },
];

export default async function StoryModePage() {
  const companies = await prisma.company.findMany({
    orderBy: { problemCount: "desc" },
  });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div className="duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Story Mode</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Pick a company and live through their real interview process as a
          time-gated, 4-stage narrative — from the first recruiter call to the
          final onsite round. Clear every stage&apos;s problems before the
          clock runs out to land the offer. Miss one, and it&apos;s a
          rejection with a post-mortem on your weakest topic.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAGE_PREVIEW.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-4 text-center"
          >
            <s.icon className="size-5 text-primary" />
            <span className="text-xs font-semibold">{s.label}</span>
            <span className="text-xs text-muted-foreground">{s.detail}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((c) => (
          <Card key={c.slug} className="flex flex-col gap-4 p-5">
            <CardHeader className="px-0">
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="truncate">{c.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4 px-0">
              <p className="text-sm text-muted-foreground">
                {c.problemCount} problems in their roster
              </p>
              <div className="mt-auto">
                <StartStoryButton companySlug={c.slug} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {companies.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No companies available yet.
        </p>
      )}
    </div>
  );
}
