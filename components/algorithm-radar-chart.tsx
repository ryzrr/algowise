"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type ChartData = {
  topic: string;
  total: number;
  solved: number;
  score: number;
};

export function AlgorithmRadarChart({ data }: { data: ChartData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-sm text-muted-foreground">No algorithm data available.</span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="var(--border)" strokeOpacity={0.5} />
        <PolarAngleAxis
          dataKey="topic"
          tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontWeight: 500 }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const d = payload[0].payload as ChartData;
              return (
                <div className="rounded-lg border border-border bg-background p-3 text-sm shadow-xl">
                  <div className="font-semibold">{d.topic}</div>
                  <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                    <div className="size-2 rounded-full bg-primary" />
                    <span>Solved: <strong className="text-foreground">{d.solved}</strong></span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-muted-foreground">
                    <div className="size-2 rounded-full bg-muted" />
                    <span>Total: {d.total}</span>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Radar
          name="Proficiency"
          dataKey="score"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="var(--primary)"
          fillOpacity={0.25}
          isAnimationActive={true}
          animationDuration={1500}
          animationEasing="ease-out"
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
