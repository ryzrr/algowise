"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

export function StoryModeConfetti() {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    const timeout = setTimeout(() => {
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 }, scalar: 1.1 });
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  return null;
}
