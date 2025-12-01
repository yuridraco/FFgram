"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { VerificationBadge } from "@/components/ui/verification-badge"
import type { User } from "@/lib/auth"
import { Search, UserPlus, Loader2 } from "lucide-react"

interface SearchUser {
  id: string
  ff_uid: string
  ff_name: string
  avatar_url: string | null
  ff_level: number
  verification_type: "owner" | "bot" | "verified" | null
}

export function SearchClient({ currentUser }: { currentUser: User }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setHasSearched(true)

    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.users || [])
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground mb-4">Buscar Jogadores</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Buscar por nome ou UID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-secondary border-border focus:border-neon-cyan"
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-neon-orange to-neon-cyan text-background"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </Button>
        </form>
      </header>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-neon-cyan" />
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum jogador encontrado.</p>
          </div>
        ) : (
          results.map((user) => (
            <Link
              key={user.id}
              href={`/perfil/${user.ff_uid}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-card/80 border border-border hover:border-neon-cyan/50 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-orange to-neon-cyan flex items-center justify-center text-background font-bold overflow-hidden">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url || "/placeholder.svg"}
                    alt={user.ff_name}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                ) : (
                  user.ff_name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-foreground truncate">{user.ff_name}</span>
                  <VerificationBadge type={user.verification_type} size="sm" />
                </div>
                <span className="text-sm text-muted-foreground">Nível {user.ff_level}</span>
              </div>
              {user.id !== currentUser.id && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 bg-transparent"
                  onClick={(e) => {
                    e.preventDefault()
                    // Handle add friend
                  }}
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
