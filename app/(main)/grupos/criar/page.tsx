"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VerificationBadge } from "@/components/ui/verification-badge"
import { Loader2, Users, Check } from "lucide-react"

interface Friend {
  id: string
  ff_uid: string
  ff_name: string
  avatar_url: string | null
  verification_type: "owner" | "bot" | "verified" | null
}

export default function CriarGrupoPage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [friends, setFriends] = useState<Friend[]>([])
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await fetch("/api/friends")
        if (res.ok) {
          const data = await res.json()
          setFriends(data.friends)
        }
      } catch (error) {
        console.error("Erro ao buscar amigos:", error)
      } finally {
        setIsFetching(false)
      }
    }
    fetchFriends()
  }, [])

  const toggleFriend = (friendId: string) => {
    setSelectedFriends((prev) => (prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Nome do grupo é obrigatório")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          memberIds: selectedFriends,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao criar grupo")
      }

      const data = await res.json()
      router.push(`/grupos/${data.group.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar grupo")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="gradient-border bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-neon-orange" />
            Criar Grupo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Grupo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Squad BOOYAH"
                className="bg-secondary border-border focus:border-neon-cyan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o grupo..."
                rows={3}
                className="bg-secondary border-border focus:border-neon-cyan resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Adicionar Membros</Label>
              <p className="text-sm text-muted-foreground">Os membros receberão um convite para participar do grupo.</p>

              {isFetching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-neon-cyan" />
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Você ainda não tem amigos.</p>
                  <p className="text-sm">Adicione amigos para criar grupos!</p>
                </div>
              ) : (
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {friends.map((friend) => {
                    const isSelected = selectedFriends.includes(friend.id)
                    return (
                      <button
                        key={friend.id}
                        type="button"
                        onClick={() => toggleFriend(friend.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                          isSelected
                            ? "bg-neon-cyan/20 border border-neon-cyan"
                            : "bg-secondary hover:bg-secondary/80 border border-transparent"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-orange to-neon-cyan flex items-center justify-center text-background font-bold overflow-hidden">
                          {friend.avatar_url ? (
                            <Image
                              src={friend.avatar_url || "/placeholder.svg"}
                              alt={friend.ff_name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            friend.ff_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-foreground">{friend.ff_name}</span>
                            <VerificationBadge type={friend.verification_type} size="sm" />
                          </div>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isSelected ? "bg-neon-cyan text-background" : "border-2 border-muted-foreground"
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-neon-red bg-neon-red/10 p-2 rounded-lg">{error}</p>}

            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="w-full bg-gradient-to-r from-neon-orange to-neon-cyan text-background hover:opacity-90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Grupo"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
