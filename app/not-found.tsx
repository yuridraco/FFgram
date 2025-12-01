"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { Home, ArrowLeft, Flame } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Glitch Effect 404 */}
        <div className="relative">
          <h1 className="text-[150px] font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-orange via-neon-red to-neon-cyan leading-none animate-pulse">
            404
          </h1>
          <div className="absolute inset-0 text-[150px] font-black text-neon-cyan/20 leading-none blur-xl">404</div>
        </div>

        {/* Logo */}
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            <Flame className="w-6 h-6 text-neon-orange animate-pulse" />
            Página não encontrada
            <Flame className="w-6 h-6 text-neon-orange animate-pulse" />
          </h2>
          <p className="text-muted-foreground">
            Parece que você se perdeu no campo de batalha! Esta página não existe ou foi removida.
          </p>
        </div>

        {/* Decorative Line */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neon-orange to-transparent" />
          <span className="text-neon-cyan text-xl">✦</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent" />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/feed">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-neon-orange to-neon-cyan text-background hover:opacity-90">
              <Home className="w-4 h-4 mr-2" />
              Ir para o Feed
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Stats decoration */}
        <div className="pt-8 flex justify-center gap-8 text-sm text-muted-foreground">
          <div className="text-center">
            <div className="text-2xl font-bold text-neon-orange">BOOYAH!</div>
            <div>Volte para a ação</div>
          </div>
        </div>
      </div>
    </div>
  )
}
