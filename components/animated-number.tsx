"use client";

import { useEffect, useRef } from "react";
import { animate, useInView } from "framer-motion";

/**
 * Counts up to `value` once it scrolls into view. Writes to the DOM node
 * directly so we don't re-render on every animation frame.
 */
export function AnimatedNumber({
  value,
  className,
  duration = 0.9,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(latest) {
        node.textContent = Math.round(latest).toLocaleString();
      },
    });
    return () => controls.stop();
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      0
    </span>
  );
}
