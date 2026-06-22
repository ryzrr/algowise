import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground ring-1 ring-inset ring-white/20",
        className
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-[58%]">
        <path
          d="M3.5 6.5 9.5 12 3.5 17.5"
          stroke="currentColor"
          strokeWidth={2.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M13.5 18h7" stroke="currentColor" strokeWidth={2.75} strokeLinecap="round" />
      </svg>
    </div>
  );
}
