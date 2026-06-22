"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StreakBadge } from "@/components/streak-badge";
import { LogOut, Search, TrendingDown, TrendingUp, Shuffle, Settings } from "lucide-react";
import { signOutAction } from "@/actions/auth-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export type RandomProblem = {
  companySlug: string;
  companyName: string;
  problemId: string;
} | null;

export function Topbar({
  user,
  streak,
  solvedToday,
  weeklyDelta,
  randomProblem,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
  streak: number;
  solvedToday: boolean;
  weeklyDelta: { thisWeek: number; deltaPct: number };
  randomProblem: RandomProblem;
}) {
  const initials = (user.name ?? user.email ?? "?").slice(0, 1).toUpperCase();
  const trendUp = weeklyDelta.deltaPct >= 0;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border px-6">
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 rounded-md outline-none ring-offset-background transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring text-left">
            <Avatar className="size-9 rounded-md ring-1 ring-border">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-medium">{user.name ?? "Anonymous"}</p>
              <p className="text-xs text-muted-foreground">Welcome back</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/settings" />}>
              <Settings className="size-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOutAction()}>
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-1 hidden items-center gap-1.5 rounded-md border border-border bg-card/60 px-3 py-1.5 md:flex">
          <span className="label-mono">Wk</span>
          <span className="font-mono text-sm font-semibold tabular-nums">{weeklyDelta.thisWeek}</span>
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              trendUp ? "text-primary" : "text-rose-400"
            )}
          >
            {trendUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {Math.abs(weeklyDelta.deltaPct)}%
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() =>
            document.dispatchEvent(new CustomEvent("open-command-palette"))
          }
          className="hidden items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex"
        >
          <Search className="size-4" />
          <span>Search companies...</span>
          <kbd className="ml-1 rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>

        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-md border border-border bg-card/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
                onClick={() =>
                  document.dispatchEvent(new CustomEvent("open-command-palette"))
                }
              />
            }
          >
            <Search className="size-4" />
          </TooltipTrigger>
          <TooltipContent>Search companies (⌘K)</TooltipContent>
        </Tooltip>

        {randomProblem && (
          <Link
            href={`/companies/${randomProblem.companySlug}?focus=${randomProblem.problemId}`}
            className={cn(buttonVariants({ size: "lg" }), "gap-1.5 font-semibold")}
          >
            <Shuffle className="size-4" />
            <span className="hidden sm:inline">Random problem</span>
          </Link>
        )}

        <ThemeToggle />

        <StreakBadge streak={streak} solvedToday={solvedToday} />
      </div>
    </header>
  );
}
