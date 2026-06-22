function toDayKey(date: Date): string {
  // Use local date components (NOT .toISOString() which is UTC)
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export type StreakStats = {
  currentStreak: number;
  longestStreak: number;
  activityByDay: Record<string, number>;
  solvedToday: boolean;
};

export function computeStreak(solvedDates: Date[]): StreakStats {
  const activityByDay: Record<string, number> = {};
  for (const date of solvedDates) {
    const key = toDayKey(date);
    activityByDay[key] = (activityByDay[key] ?? 0) + 1;
  }

  const days = Object.keys(activityByDay).sort();
  if (days.length === 0) {
    return { currentStreak: 0, longestStreak: 0, activityByDay, solvedToday: false };
  }

  const dayMs = 24 * 60 * 60 * 1000;

  // Longest streak calculation using local dates
  let longestStreak = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of days) {
    if (prev !== null) {
      const prevDate = new Date(prev + "T12:00:00");
      const curDate = new Date(day + "T12:00:00");
      const diff = curDate.getTime() - prevDate.getTime();
      if (Math.round(diff / dayMs) === 1) {
        run += 1;
      } else {
        run = 1;
      }
    } else {
      run = 1;
    }
    longestStreak = Math.max(longestStreak, run);
    prev = day;
  }

  const today = new Date();
  const todayKey = toDayKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const daySet = new Set(days);
  const solvedToday = daySet.has(todayKey);

  // Current streak — walk backwards from today
  let cursorDate = solvedToday ? new Date(today) : new Date(yesterday);
  let currentStreak = 0;
  while (daySet.has(toDayKey(cursorDate))) {
    currentStreak += 1;
    cursorDate.setDate(cursorDate.getDate() - 1);
  }

  return { currentStreak, longestStreak, activityByDay, solvedToday };
}
