"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  label,
  sublabel,
  color = "var(--color-primary)",
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));

  const wrapRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(wrapRef, { once: true, margin: "-20px" });

  const progress = useMotionValue(0);
  const dashoffset = useTransform(
    progress,
    (p) => circumference - (p / 100) * circumference
  );

  useEffect(() => {
    if (!inView) return;
    const controls = animate(progress, clamped, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
    });
    const unsub = progress.on("change", (v) => {
      if (!label && labelRef.current) labelRef.current.textContent = `${Math.round(v)}%`;
    });
    return () => {
      controls.stop();
      unsub();
    };
  }, [inView, clamped, label, progress]);

  return (
    <div
      ref={wrapRef}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashoffset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label ? (
          <span className="font-mono text-2xl font-semibold tabular-nums">{label}</span>
        ) : (
          <span ref={labelRef} className="font-mono text-2xl font-semibold tabular-nums">
            0%
          </span>
        )}
        {sublabel && <span className="text-xs text-muted-foreground">{sublabel}</span>}
      </div>
    </div>
  );
}
