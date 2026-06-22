import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCompanyDetail } from "@/lib/data";
import { getInterviewTarget } from "@/lib/interview-target";
import { ProblemTable } from "@/components/problem-table";
import { InterviewCountdownWidget } from "@/components/interview-countdown-widget";
import { Progress } from "@/components/ui/progress";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function CompanyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ focus?: string }>;
}) {
  const { slug } = await params;
  const { focus } = await searchParams;
  const session = await auth();
  const userId = session!.user!.id!;
  const [company, interviewTarget] = await Promise.all([
    getCompanyDetail(slug, userId),
    getInterviewTarget(userId, slug),
  ]);

  if (!company) notFound();

  const solved = company.rows.filter((r) => r.status === "SOLVED").length;
  const pct = company.rows.length > 0 ? (solved / company.rows.length) * 100 : 0;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div className="duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-3xl font-bold tracking-tight">{company.name}</h1>
          <Link
            href={`/companies/${company.slug}/leaderboard`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <Trophy className="size-4" />
            Leaderboard
          </Link>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Progress value={pct} className="h-2 flex-1" />
          <span className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
            {solved}/{company.rows.length}
          </span>
        </div>
      </div>

      <InterviewCountdownWidget
        companySlug={company.slug}
        companyName={company.name}
        target={interviewTarget}
      />

      <ProblemTable rows={company.rows} companySlug={company.slug} focusId={focus} />
    </div>
  );
}
