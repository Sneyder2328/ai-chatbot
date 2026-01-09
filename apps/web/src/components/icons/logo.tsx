import { cn } from "../../lib/utils"

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      className={cn("h-16 w-16", className)}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="logoTitle"
    >
      <title id="logoTitle">Ask Cosmos Logo</title>
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient
          id="logoGradientLight"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
      </defs>
      {/* Main shape - stylized A */}
      <path
        d="M32 8L8 56h12l4-10h20l4 10h12L32 8zm0 18l6 14H26l6-14z"
        fill="url(#logoGradient)"
      />
      {/* Accent arc */}
      <path
        d="M32 4C18.745 4 8 14.745 8 28c0 4.5 1.2 8.7 3.3 12.3"
        stroke="url(#logoGradientLight)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M52.7 40.3C54.8 36.7 56 32.5 56 28c0-13.255-10.745-24-24-24"
        stroke="url(#logoGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  )
}
