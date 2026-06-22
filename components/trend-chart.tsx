"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useMemo } from "react";

export type TrendPoint = { date: string; total: number };

export function TrendChart({
  data,
  height = 220,
}: {
  data: TrendPoint[];
  height?: number;
}) {
  const enrichedData = useMemo(() => {
    return data.map((d, i) => {
      const prevTotal = i === 0 ? d.total : data[i - 1].total;
      return {
        ...d,
        daily: Math.max(0, d.total - prevTotal),
        formattedDate: new Date(d.date + "T12:00:00").toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
      };
    });
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Solve a problem to start your trend line.
      </div>
    );
  }

  return (
    <div style={{ height: height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={enrichedData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
          <XAxis 
            dataKey="formattedDate" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            minTickGap={30}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            allowDecimals={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                return (
                  <div className="rounded-lg border border-border bg-background p-3 text-sm shadow-xl">
                    <div className="font-semibold">{d.formattedDate}</div>
                    <div className="mt-1 flex items-center justify-between gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full bg-primary" />
                        <span>Cumulative</span>
                      </div>
                      <strong className="text-foreground">{d.total}</strong>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full bg-muted-foreground" />
                        <span>Daily Solved</span>
                      </div>
                      <strong className="text-foreground">{d.daily}</strong>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="var(--primary)"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorTotal)"
            activeDot={{ r: 6, fill: "var(--primary)", stroke: "var(--background)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
