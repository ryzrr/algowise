"use client";

import { useEffect, useState } from "react";

const SYMBOLS = ["{ }", "</>", "( )", "[ ]", "=>", "&&", "||", "++", "=="];

export function FloatingSymbols() {
  const [elements, setElements] = useState<{ id: number; symbol: string; left: number; top: number; delay: number; size: number }[]>([]);

  useEffect(() => {
    // Generate random elements on the client to avoid hydration mismatches
    const newElements = Array.from({ length: 12 }).map((_, i) => {
      let left = Math.random() * 100;
      let top = Math.random() * 100;

      // Avoid the center box (left 25-75%, top 20-80%)
      if (left > 25 && left < 75 && top > 20 && top < 80) {
        if (Math.random() > 0.5) {
          left = Math.random() > 0.5 ? Math.random() * 25 : 75 + Math.random() * 25;
        } else {
          top = Math.random() > 0.5 ? Math.random() * 20 : 80 + Math.random() * 20;
        }
      }

      return {
        id: i,
        symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        left,
        top,
        delay: Math.random() * 5,
        size: Math.random() * 30 + 15, // 15px to 45px
      };
    });
    setElements(newElements);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {elements.map((el) => (
        <div
          key={el.id}
          className="absolute text-primary/30 font-mono font-bold select-none animate-float opacity-0"
          style={{
            left: `${el.left}%`,
            top: `${el.top}%`,
            fontSize: `${el.size}px`,
            animationDelay: `${el.delay}s`,
            animationDuration: `${Math.random() * 10 + 15}s`,
          }}
        >
          {el.symbol}
        </div>
      ))}
    </div>
  );
}
