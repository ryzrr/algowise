"use client";

import { useState } from "react";
import { cn, avatarGradient } from "@/lib/utils";

export function CompanyLogo({
  src,
  alt,
  className,
  hideFallback = false,
}: {
  src: string;
  alt: string;
  className?: string;
  hideFallback?: boolean;
}) {
  const [error, setError] = useState(false);

  if (error) {
    if (hideFallback) return null;
    return (
      <div
        className={cn(
          "flex size-full items-center justify-center rounded bg-gradient-to-br text-sm font-semibold text-white",
          avatarGradient(alt)
        )}
      >
        {alt.slice(0, 1).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}
