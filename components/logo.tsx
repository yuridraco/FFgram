export function Logo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { container: "w-8 h-8", icon: "w-5 h-5", text: "text-lg", dot: "w-2 h-2" },
    md: { container: "w-10 h-10", icon: "w-6 h-6", text: "text-xl", dot: "w-3 h-3" },
    lg: { container: "w-14 h-14", icon: "w-8 h-8", text: "text-3xl", dot: "w-4 h-4" },
  }

  const s = sizes[size]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div
          className={`${s.container} bg-gradient-to-br from-neon-orange via-neon-red to-neon-cyan rounded-xl flex items-center justify-center glow-orange`}
        >
          <span className={`${s.icon} text-background font-black`}>FF</span>
        </div>
        <div className={`absolute -top-1 -right-1 ${s.dot} bg-neon-green rounded-full animate-pulse`} />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`${s.text} font-black text-foreground`}>
          FF<span className="text-neon-orange">gram</span>
        </span>
      </div>
    </div>
  )
}
