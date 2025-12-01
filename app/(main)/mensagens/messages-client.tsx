"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { VerificationBadge } from "@/components/ui/verification-badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { User } from "@/lib/auth"
import { MessageCircle, Users, Plus, Check, X, Search, UserPlus } from "lucide-react"

interface OtherUser {
  id: string
  ff_uid: string
  ff_name: string
  display_name?: string
  avatar_url: string | null
  verification_type: "owner" | "bot" | "verified" | "vip" | "pro" | null
}

interface Conversation {
  id: string
  otherUser: OtherUser | null
  lastMessage: {
    content: string
    created_at: string
    sender_id: string
  } | null
}

interface Group {
  id: string
  name: string
  avatar_url: string | null
  owner_id: string
  lastMessage: {
    content: string
    created_at: string
    sender: { ff_name: string } | null
  } | null
}

interface PendingInvite {
  group: {
    id: string
    name: string
    avatar_url: string | null
    owner: { ff_name: string } | null
  } | null
}

interface Friend {
  id: string
  ff_uid: string
  ff_name: string
  display_name?: string
  avatar_url: string | null
  verification_type: "owner" | "bot" | "verified" | "vip" | "pro" | null
}

interface MessagesClientProps {
  conversations: Conversation[]
  groups: Group[]
  pendingInvites: PendingInvite[]
  currentUser: User
}

export function MessagesClient({
  conversations: initialConversations,
  groups: initialGroups,
  pendingInvites: initialPendingInvites,
  currentUser,
}: MessagesClientProps) {
  const [activeTab, setActiveTab] = useState<"chats" | "groups">("chats")
  const [pendingInvites, setPendingInvites] = useState(initialPendingInvites)
  const [conversations, setConversations] = useState(initialConversations)
  const [groups, setGroups] = useState(initialGroups)
  const [showNewChat, setShowNewChat] = useState(false)
  const [friends, setFriends] = useState<Friend[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoadingFriends, setIsLoadingFriends] = useState(false)

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/messages/conversations")
        if (res.ok) {
          const data = await res.json()
          setConversations(data.conversations || [])
          setGroups(data.groups || [])
          setPendingInvites(data.pendingInvites || [])
        }
      } catch (error) {
        console.error("Erro ao atualizar:", error)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const loadFriends = async () => {
    setIsLoadingFriends(true)
    try {
      const res = await fetch("/api/friends")
      if (res.ok) {
        const data = await res.json()
        setFriends(data.friends || [])
      }
    } catch (error) {
      console.error("Erro ao buscar amigos:", error)
    } finally {
      setIsLoadingFriends(false)
    }
  }

  const handleNewChat = () => {
    setShowNewChat(true)
    loadFriends()
  }

  const startConversation = async (friendId: string) => {
    try {
      const res = await fetch("/api/messages/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: friendId }),
      })

      if (res.ok) {
        const data = await res.json()
        window.location.href = `/mensagens/${data.conversationId}`
      }
    } catch (error) {
      console.error("Erro ao iniciar conversa:", error)
    }
  }

  const handleInviteResponse = async (groupId: string, accept: boolean) => {
    try {
      const endpoint = accept ? "accept" : "reject"
      await fetch(`/api/groups/${groupId}/${endpoint}`, { method: "POST" })
      setPendingInvites((prev) => prev.filter((inv) => inv.group?.id !== groupId))
    } catch (error) {
      console.error("Erro ao responder convite:", error)
    }
  }

  const filteredFriends = friends.filter(
    (f) =>
      f.ff_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.display_name && f.display_name.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  if (showNewChat) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNewChat(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Nova Conversa</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar amigo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>

        <div className="space-y-1">
          <Link href="/grupos/criar" className="block">
            <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-neon-cyan" />
              </div>
              <span className="font-medium text-foreground">Novo grupo</span>
            </div>
          </Link>

          <div className="h-px bg-border my-2" />

          {isLoadingFriends ? (
            <div className="text-center py-8 text-muted-foreground">Carregando amigos...</div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum amigo encontrado.</p>
              <p className="text-sm">Adicione amigos para conversar!</p>
            </div>
          ) : (
            filteredFriends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => startConversation(friend.id)}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-orange to-neon-cyan flex items-center justify-center text-background font-bold overflow-hidden">
                  {friend.avatar_url ? (
                    <Image
                      src={friend.avatar_url || "/placeholder.svg"}
                      alt={friend.ff_name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    friend.ff_name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-foreground">{friend.display_name || friend.ff_name}</span>
                    <VerificationBadge type={friend.verification_type} size="sm" />
                  </div>
                  <span className="text-sm text-muted-foreground">@{friend.ff_name}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Mensagens</h1>
        <div className="flex gap-2">
          <Button size="icon" variant="ghost" onClick={handleNewChat} className="text-neon-cyan hover:bg-neon-cyan/10">
            <MessageCircle className="w-5 h-5" />
          </Button>
          <Link href="/grupos/criar">
            <Button size="icon" variant="ghost" className="text-neon-orange hover:bg-neon-orange/10">
              <Plus className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Convites Pendentes */}
      {pendingInvites.length > 0 && (
        <Card className="gradient-border bg-card/80 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-neon-orange flex items-center gap-2">
            <Users className="w-4 h-4" />
            Convites de Grupos ({pendingInvites.length})
          </h2>
          {pendingInvites.map(
            (invite) =>
              invite.group && (
                <div key={invite.group.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-orange to-neon-cyan flex items-center justify-center text-background font-bold">
                      {invite.group.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{invite.group.name}</p>
                      <p className="text-xs text-muted-foreground">Convite de {invite.group.owner?.ff_name}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleInviteResponse(invite.group!.id, true)}
                      className="text-neon-green hover:bg-neon-green/10"
                    >
                      <Check className="w-5 h-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleInviteResponse(invite.group!.id, false)}
                      className="text-neon-red hover:bg-neon-red/10"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ),
          )}
        </Card>
      )}

      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("chats")}
          className={`flex-1 py-3 text-center font-medium transition-all relative ${
            activeTab === "chats" ? "text-neon-cyan" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Conversas
          {activeTab === "chats" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-cyan" />}
        </button>
        <button
          onClick={() => setActiveTab("groups")}
          className={`flex-1 py-3 text-center font-medium transition-all relative ${
            activeTab === "groups" ? "text-neon-orange" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Grupos
          {activeTab === "groups" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-orange" />}
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-1">
        {activeTab === "chats" ? (
          conversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma conversa ainda.</p>
              <p className="text-sm">Toque no icone de mensagem para iniciar!</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <Link key={conv.id} href={`/mensagens/${conv.id}`} className="block">
                <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neon-orange to-neon-cyan flex items-center justify-center text-background font-bold overflow-hidden">
                    {conv.otherUser?.avatar_url ? (
                      <Image
                        src={conv.otherUser.avatar_url || "/placeholder.svg"}
                        alt={conv.otherUser.ff_name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      conv.otherUser?.ff_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-foreground">
                          {conv.otherUser?.display_name || conv.otherUser?.ff_name}
                        </span>
                        <VerificationBadge type={conv.otherUser?.verification_type || null} size="sm" />
                      </div>
                      {conv.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conv.lastMessage.created_at), {
                            addSuffix: false,
                            locale: ptBR,
                          })}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage.sender_id === currentUser.id && "Você: "}
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )
        ) : groups.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum grupo ainda.</p>
            <p className="text-sm">Crie um grupo para conversar com vários amigos!</p>
          </div>
        ) : (
          groups.map((group) => (
            <Link key={group.id} href={`/grupos/${group.id}`} className="block">
              <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-colors">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neon-cyan to-neon-orange flex items-center justify-center text-background font-bold overflow-hidden">
                  {group.avatar_url ? (
                    <Image
                      src={group.avatar_url || "/placeholder.svg"}
                      alt={group.name}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    group.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{group.name}</span>
                    {group.lastMessage && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(group.lastMessage.created_at), {
                          addSuffix: false,
                          locale: ptBR,
                        })}
                      </span>
                    )}
                  </div>
                  {group.lastMessage && (
                    <p className="text-sm text-muted-foreground truncate">
                      {group.lastMessage.sender?.ff_name}: {group.lastMessage.content}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
