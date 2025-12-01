import { cn } from "@/lib/utils"
import Image from "next/image"

interface VerificationBadgeProps {
  type: "owner" | "bot" | "verified" | "vip" | "pro" | null
  size?: "sm" | "md" | "lg"
  className?: string
}

export function VerificationBadge({ type, size = "md", className }: VerificationBadgeProps) {
  if (!type) return null

  const sizeClasses = {
    sm: { width: 28, height: 28, class: "w-7 h-7" },
    md: { width: 38, height: 38, class: "w-[38px] h-[38px]" },
    lg: { width: 48, height: 48, class: "w-12 h-12" },
  }

  const badgeImages = {
    owner: "/images/verficado-dono.png",
    bot: "/images/verficado-normal.png",
    verified: "/images/verficado-normal.png",
    vip: "/images/verificado-vip.png",
    pro: "/images/verificado-pro.png",
  }

  const titles = {
    owner: "Dono",
    bot: "Bot Oficial",
    verified: "Verificado",
    vip: "VIP",
    pro: "Pro Player",
  }

  return (
    <Image
      src={badgeImages[type] || "/placeholder.svg"}
      alt={titles[type]}
      title={titles[type]}
      width={sizeClasses[size].width}
      height={sizeClasses[size].height}
      className={cn(sizeClasses[size].class, "inline-block object-contain flex-shrink-0", className)}
      unoptimized
    />
  )
}
