"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import type { User } from "@/lib/auth"
import { Home, PlusSquare, MessageCircle, Users, UserIcon } from "lucide-react"

interface MobileNavProps {
  user: User
}

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await fetch("/api/friends/pending")
        if (res.ok) {
          const data = await res.json()
          setPendingCount(data.count)
        }
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error)
      }
    }
    fetchPending()
    const interval = setInterval(fetchPending, 30000)
    return () => clearInterval(interval)
  }, [])

  const navItems = [
    { href: "/feed", icon: Home, badge: 0 },
    { href: "/mensagens", icon: MessageCircle, badge: 0 },
    { href: "/novo-post", icon: PlusSquare, badge: 0, isMain: true },
    { href: "/amigos", icon: Users, badge: pendingCount },
    { href: `/perfil/${user.ff_uid}`, icon: UserIcon, badge: 0 },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-50 safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "p-3 rounded-xl transition-all relative",
              item.isMain && "bg-gradient-to-r from-neon-orange to-neon-cyan text-background -mt-4 shadow-lg",
              !item.isMain &&
                (pathname === item.href || pathname.startsWith(item.href.split("/").slice(0, 2).join("/"))
                  ? "text-neon-cyan bg-neon-cyan/10"
                  : "text-muted-foreground"),
            )}
          >
            <item.icon className={cn("w-6 h-6", item.isMain && "w-7 h-7")} />
            {item.badge > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold rounded-full bg-neon-orange text-background">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  )
}
