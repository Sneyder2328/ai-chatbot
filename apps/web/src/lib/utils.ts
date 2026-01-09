import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines clsx and tailwind-merge for merging Tailwind classes.
 * Handles conditional classes and resolves Tailwind class conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
