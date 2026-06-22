"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Show 52 weeks = 1 full year (like GitHub)
const WEEKS = 52;

// GitHub-style green levels
// These use explicit Tailwind classes that work in both dark and light mode
function levelStyle(count: number, isToday: boolean): string {
  let bg: string;
  if (count <= 0)       bg = "bg-[#161b22] dark:bg-[#161b22] bg-[#ebedf0]";
  else if (count === 1) bg = "bg-[#0e4429] dark:bg-[#0e4429] bg-[#9be9a8]";
  else if (count === 2) bg = "bg-[#006d32] dark:bg-[#006d32] bg-[#40c463]";
  else if (count <= 4)  bg = "bg-[#26a641] dark:bg-[#26a641] bg-[#30a14e]";
  else                  bg = "bg-[#39d353] dark:bg-[#39d353] bg-[#216e39]";

  return cn(
    "size-[11px] rounded-[2px] transition-all duration-150 cursor-default",
    isToday && "ring-1 ring-offset-1 ring-[#39d353] dark:ring-offset-[#0d1117] ring-offset-white",
    bg
  );
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_LABELS = ["Sun","","Tue","","Thu","","Sat"];

export function ActivityHeatmap({
  activityByDay,
}: {
  activityByDay: Record<string, number>;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start exactly 52 weeks (364 days) ago, from the nearest Sunday
  const start = new Date(today);
  start.setDate(start.getDate() - WEEKS * 7 + 1);
  while (start.getDay() !== 0) start.setDate(start.getDate() - 1);

  const days: { key: string; date: Date; count: number }[] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${d}`;
    days.push({ key, date: new Date(cursor), count: activityByDay[key] ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  // Chunk into columns of 7 (each column = 1 week)
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Build month label positions
  const monthLabels: { label: string; col: number }[] = [];
  weeks.forEach((week, wi) => {
    const firstDay = week[0];
    if (firstDay && (firstDay.date.getDate() <= 7)) {
      monthLabels.push({ label: MONTH_LABELS[firstDay.date.getMonth()], col: wi });
    }
  });

  const todayKey = (() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  })();

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1.5 min-w-0">
        {/* Month labels row */}
        <div className="flex gap-[3px] pl-8">
          {weeks.map((week, wi) => {
            const label = monthLabels.find(l => l.col === wi);
            return (
              <div key={wi} className="w-[11px] text-[9px] text-muted-foreground leading-none">
                {label ? label.label : ""}
              </div>
            );
          })}
        </div>

        {/* Grid area: day-of-week labels + week columns */}
        <div className="flex gap-[3px]">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] pr-1">
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="h-[11px] w-6 text-[9px] text-muted-foreground text-right leading-[11px]">
                {d}
              </div>
            ))}
          </div>

          {/* Week columns */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <Tooltip key={day.key}>
                  <TooltipTrigger
                    render={
                      <div className={levelStyle(day.count, day.key === todayKey)} />
                    }
                  />
                  <TooltipContent>
                    <span className="font-medium">{day.count} problem{day.count !== 1 ? "s" : ""}</span>
                    {" · "}
                    {day.date.toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 pl-8 mt-1">
          <span className="text-[10px] text-muted-foreground">Less</span>
          {[0, 1, 2, 3, 5].map((n) => (
            <div key={n} className={cn("size-[11px] rounded-[2px]", levelStyle(n, false))} />
          ))}
          <span className="text-[10px] text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  );
}
