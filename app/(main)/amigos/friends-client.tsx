"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { VerificationBadge } from "@/components/ui/verification-badge"
import { Card, CardContent } from "@/components/ui/card"
import type { User } from "@/lib/auth"
import { MessageCircle, UserMinus, Check, X, Users, Bell, UserPlus } from "lucide-react"
import { toast } from "sonner"

interface FriendUser {
  id: string
  ff_uid: string
  ff_name: string
  avatar_url: string | null
  ff_level: number
  verification_type: "owner" | "bot" | "verified" | "pro" | "vip" | null
  friendship_id?: string
}

interface PendingRequest {
  id: string
  requester: FriendUser
}

interface FriendsClientProps {
  currentUser: User
  initialFriends: FriendUser[]
  initialPendingRequests: PendingRequest[]
}

export function FriendsClient({ currentUser, initialFriends, initialPendingRequests }: FriendsClientProps) {
  const [friends, setFriends] = useState(initialFriends)
  const [pendingRequests, setPendingRequests] = useState(initialPendingRequests)
  const [activeTab, setActiveTab] = useState<"friends" | "pending">(
    initialPendingRequests.length > 0 ? "pending" : "friends",
  )

  const handleAcceptRequest = async (requestId: string, requester: FriendUser) => {
    try {
      const res = await fetch(`/api/friends/${requestId}/accept`, { method: "POST" })
      if (res.ok) {
        setFriends((prev) => [...prev, { ...requester, friendship_id: requestId }])
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
        toast.success("Pedido de amizade aceito!")
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao aceitar pedido")
      }
    } catch {
      toast.error("Erro ao aceitar pedido")
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/friends/${requestId}`, { method: "DELETE" })
      if (res.ok) {
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
        toast.success("Pedido recusado")
      }
    } catch {
      toast.error("Erro ao recusar pedido")
    }
  }

  const handleRemoveFriend = async (friendshipId: string) => {
    if (!confirm("Tem certeza que deseja remover este amigo?")) return

    try {
      const res = await fetch(`/api/friends/${friendshipId}`, { method: "DELETE" })
      if (res.ok) {
        setFriends((prev) => prev.filter((f) => f.friendship_id !== friendshipId))
        toast.success("Amigo removido")
      }
    } catch {
      toast.error("Erro ao remover amigo")
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Amigos</h1>
        <Link href="/buscar">
          <Button
            variant="outline"
            size="sm"
            className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 bg-transparent"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Buscar
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setActiveTab("friends")}
          className={`flex items-center justify-center gap-2 p-4 rounded-xl font-medium transition-all ${
            activeTab === "friends"
              ? "bg-neon-cyan/20 text-neon-cyan border-2 border-neon-cyan"
              : "bg-card/80 text-muted-foreground border-2 border-border hover:border-neon-cyan/50"
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Amigos ({friends.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center justify-center gap-2 p-4 rounded-xl font-medium transition-all relative ${
            activeTab === "pending"
              ? "bg-neon-orange/20 text-neon-orange border-2 border-neon-orange"
              : "bg-card/80 text-muted-foreground border-2 border-border hover:border-neon-orange/50"
          }`}
        >
          <Bell className="w-5 h-5" />
          <span>Pedidos ({pendingRequests.length})</span>
          {pendingRequests.length > 0 && activeTab !== "pending" && (
            <span className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full bg-neon-orange text-background animate-pulse">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "friends" && (
        <div className="space-y-3">
          {friends.length === 0 ? (
            <Card className="bg-card/80 border-border">
              <CardContent className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground mb-4">Você ainda não tem amigos.</p>
                <Link href="/buscar">
                  <Button className="bg-gradient-to-r from-neon-orange to-neon-cyan text-background">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Buscar Jogadores
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-card/80 border border-border hover:border-neon-cyan/50 transition-all"
              >
                <Link href={`/perfil/${friend.ff_uid}`} className="flex items-center gap-4 flex-1">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neon-orange to-neon-cyan flex items-center justify-center text-background font-bold text-lg overflow-hidden">
                    {friend.avatar_url ? (
                      <Image
                        src={friend.avatar_url || "/placeholder.svg"}
                        alt={friend.ff_name}
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      friend.ff_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate text-lg">{friend.ff_name}</span>
                      <VerificationBadge type={friend.verification_type} size="md" />
                    </div>
                    <span className="text-sm text-muted-foreground">Nível {friend.ff_level}</span>
                  </div>
                </Link>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-neon-cyan hover:bg-neon-cyan/10 h-12 w-12"
                    asChild
                  >
                    <Link href={`/mensagens/${friend.id}`}>
                      <MessageCircle className="w-6 h-6" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-neon-red hover:bg-neon-red/10 h-12 w-12"
                    onClick={() => handleRemoveFriend(friend.friendship_id!)}
                  >
                    <UserMinus className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "pending" && (
        <div className="space-y-3">
          {pendingRequests.length === 0 ? (
            <Card className="bg-card/80 border-border">
              <CardContent className="text-center py-12">
                <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">Nenhum pedido de amizade pendente.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="bg-neon-orange/10 border-neon-orange/50">
                <CardContent className="py-3 px-4">
                  <p className="text-neon-orange font-medium text-center">
                    Você tem {pendingRequests.length} pedido{pendingRequests.length > 1 ? "s" : ""} de amizade!
                  </p>
                </CardContent>
              </Card>

              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card/80 border-2 border-neon-orange/30 hover:border-neon-orange transition-all"
                >
                  <Link href={`/perfil/${request.requester.ff_uid}`} className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neon-orange to-neon-cyan flex items-center justify-center text-background font-bold text-lg overflow-hidden">
                      {request.requester.avatar_url ? (
                        <Image
                          src={request.requester.avatar_url || "/placeholder.svg"}
                          alt={request.requester.ff_name}
                          width={56}
                          height={56}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        request.requester.ff_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground truncate text-lg">
                          {request.requester.ff_name}
                        </span>
                        <VerificationBadge type={request.requester.verification_type} size="md" />
                      </div>
                      <span className="text-sm text-neon-orange">Quer ser seu amigo</span>
                    </div>
                  </Link>
                  <div className="flex gap-2">
                    <Button
                      size="lg"
                      className="bg-neon-green hover:bg-neon-green/80 text-background h-12 w-12"
                      onClick={() => handleAcceptRequest(request.id, request.requester)}
                    >
                      <Check className="w-6 h-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="lg"
                      className="text-muted-foreground hover:text-neon-red hover:bg-neon-red/10 h-12 w-12"
                      onClick={() => handleRejectRequest(request.id)}
                    >
                      <X className="w-6 h-6" />
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
