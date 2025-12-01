"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Logo } from "./logo"
import { VerificationBadge } from "./ui/verification-badge"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"
import type { User } from "@/lib/auth"
import {
  Home,
  Search,
  PlusSquare,
  MessageCircle,
  Users,
  UserIcon,
  Settings,
  LogOut,
  Shield,
  UsersRound,
} from "lucide-react"

interface SidebarProps {
  user: User
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
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

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  const isOwner = user.verification_type === "owner" || user.verification_type === "pro"

  const navItems = [
    { href: "/feed", icon: Home, label: "Feed" },
    { href: "/buscar", icon: Search, label: "Buscar" },
    { href: "/novo-post", icon: PlusSquare, label: "Novo Post" },
    { href: "/mensagens", icon: MessageCircle, label: "Mensagens" },
    { href: "/grupos", icon: UsersRound, label: "Grupos" },
    { href: "/amigos", icon: Users, label: "Amigos", badge: pendingCount },
  ]

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col bg-card/80 backdrop-blur-sm border-r border-border p-4 z-50">
      <div className="mb-8">
        <Logo />
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative",
              pathname === item.href || pathname.startsWith(item.href + "/")
                ? "bg-neon-cyan/10 text-neon-cyan"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[20px] h-5 flex items-center justify-center px-1.5 text-xs font-bold rounded-full bg-neon-orange text-background">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </Link>
        ))}

        <Link
          href={`/perfil/${user.ff_uid}`}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
            pathname.startsWith("/perfil")
              ? "bg-neon-cyan/10 text-neon-cyan"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary",
          )}
        >
          <UserIcon className="w-5 h-5" />
          <span className="font-medium">Meu Perfil</span>
        </Link>

        {isOwner && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
              pathname === "/admin"
                ? "bg-neon-green/10 text-neon-green"
                : "text-neon-green/70 hover:text-neon-green hover:bg-neon-green/10",
            )}
          >
            <Shield className="w-5 h-5" />
            <span className="font-medium">Admin</span>
          </Link>
        )}
      </nav>

      <div className="border-t border-border pt-4 space-y-2">
        <Link
          href="/configuracoes"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Configurações</span>
        </Link>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 px-4 py-3 text-muted-foreground hover:text-neon-red hover:bg-neon-red/10"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </Button>
      </div>

      <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-orange to-neon-cyan flex items-center justify-center text-background font-bold overflow-hidden">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url || "/placeholder.svg"}
                alt={user.ff_name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              user.ff_name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-foreground truncate">{user.display_name || user.ff_name}</span>
              <VerificationBadge type={user.verification_type} size="sm" />
            </div>
            <span className="text-xs text-muted-foreground">
              @{user.ff_name} • Nv. {user.ff_level}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
