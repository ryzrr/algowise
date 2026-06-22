"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Building2,
  Star,
  Search,
  Flame,
  MessageSquare,
  Zap,
  Trophy,
  EyeOff,
  Swords,
  BookMarked,
  Drama,
  Download,
  CalendarClock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { LogoMark } from "@/components/icons/logo-mark";
import { cn, avatarGradient } from "@/lib/utils";

export type SidebarCompany = {
  slug: string;
  name: string;
  problemCount: number;
  solved: number;
};

export function Sidebar({
  companies,
  streak,
  dueCount = 0,
  nearestTarget,
}: {
  companies: SidebarCompany[];
  streak: number;
  dueCount?: number;
  nearestTarget?: { companyName: string; companySlug: string; daysRemaining: number } | null;
}) {
  const pathname = usePathname();

  const navItem = (href: string, label: string, Icon: typeof Home, badge?: number) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-[0.98]",
          active
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
        )}
      >
        <Icon className="size-4" />
        <span className="flex-1">{label}</span>
        {!!badge && (
          <Badge variant="default" className="h-5 min-w-5 justify-center px-1 font-mono text-[10px]">
            {badge}
          </Badge>
        )}
      </Link>
    );
  };

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <LogoMark className="size-9" />
        <span className="font-heading text-base font-semibold tracking-tight">AlgoWise</span>
      </div>

      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 px-3">
          {navItem("/", "Home", Home)}
          {navItem("/companies", "Companies", Building2)}
          {navItem("/revision", "Revision", Star, dueCount)}
          {navItem("/lists", "My Lists", BookMarked)}
          {navItem("/match", "Company Match", Zap)}
          {navItem("/achievements", "Achievements", Trophy)}
          {navItem("/community", "Community", MessageSquare)}

          <div className="my-2 border-t border-border/60" />
          <span className="px-3 pb-1 text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">
            Game modes
          </span>
          {navItem("/blind", "Blind Mode", EyeOff)}
          {navItem("/story-mode", "Story Mode", Drama)}
          {navItem("/war-room", "War Room", Swords)}

          <div className="my-2 border-t border-border/60" />
          {navItem("/import", "Import Progress", Download)}
        </nav>
      </ScrollArea>

      <div className="flex flex-col gap-2 p-3 mt-auto">
        {nearestTarget && (
          <Link
            href={`/companies/${nearestTarget.companySlug}`}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-xs transition-colors hover:bg-muted/40"
          >
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarClock className="size-3.5" />
              {nearestTarget.companyName}
            </span>
            <span
              className={cn(
                "font-mono font-semibold",
                nearestTarget.daysRemaining <= 7 && "text-rose-400"
              )}
            >
              {nearestTarget.daysRemaining}d
            </span>
          </Link>
        )}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="label-mono">{streak > 0 ? "Current streak" : "Get started"}</span>
            <Flame
              className={cn("size-4", streak > 0 ? "text-primary" : "text-muted-foreground")}
              strokeWidth={2}
            />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums">
            {streak > 0 ? `${streak} day${streak === 1 ? "" : "s"}` : "Day 0"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {streak > 0
              ? "Solve one today to keep it alive."
              : "Solve one today to start a streak."}
          </p>
          <Link
            href="/companies"
            className={cn(buttonVariants({ size: "sm" }), "mt-3 w-full")}
          >
            Browse companies
          </Link>
        </div>
      </div>
    </aside>
  );
}
