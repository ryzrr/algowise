import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const AVATAR_GRADIENTS = [
  "from-primary/40 to-emerald-500/20",
  "from-sky-400/30 to-primary/20",
  "from-amber-400/30 to-primary/20",
  "from-cyan-400/25 to-primary/20",
]

export function avatarGradient(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_GRADIENTS.length
  return AVATAR_GRADIENTS[idx]
}
