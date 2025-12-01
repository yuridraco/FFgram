"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { VerificationBadge } from "@/components/ui/verification-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { User } from "@/lib/auth"
import { ArrowLeft, Send, Users } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

interface MessageSender {
  id: string
  ff_name: string
  avatar_url: string | null
  verification_type: "owner" | "bot" | "verified" | null
}

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  sender: MessageSender
}

interface Member {
  user: {
    id: string
    ff_uid: string
    ff_name: string
    avatar_url: string | null
    verification_type: "owner" | "bot" | "verified" | null
  }
  role: string
}

interface Group {
  id: string
  name: string
  description: string | null
  avatar_url: string | null
  owner_id: string
  owner: {
    id: string
    ff_name: string
    verification_type: "owner" | "bot" | "verified" | null
  }
}

interface GroupChatClientProps {
  group: Group
  members: Member[]
  initialMessages: Message[]
  currentUser: User
  isOwner: boolean
}

export function GroupChatClient({ group, members, initialMessages, currentUser, isOwner }: GroupChatClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Polling para novas mensagens
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/groups/${group.id}/messages`)
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages)
        }
      } catch (error) {
        console.error("Erro ao buscar mensagens:", error)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [group.id])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    const messageContent = newMessage
    setNewMessage("")

    try {
      const res = await fetch(`/api/groups/${group.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, data.message])
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      setNewMessage(messageContent)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-screen max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link href="/mensagens">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan to-neon-orange flex items-center justify-center text-background font-bold overflow-hidden">
            {group.avatar_url ? (
              <Image
                src={group.avatar_url || "/placeholder.svg"}
                alt={group.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              group.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <span className="font-semibold text-foreground">{group.name}</span>
            <p className="text-xs text-muted-foreground">{members.length} membros</p>
          </div>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Users className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-card border-border">
            <SheetHeader>
              <SheetTitle className="text-foreground">Membros do Grupo</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-3">
              {members.map((member) => (
                <Link
                  key={member.user.id}
                  href={`/perfil/${member.user.ff_uid}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-orange to-neon-cyan flex items-center justify-center text-background font-bold overflow-hidden">
                    {member.user.avatar_url ? (
                      <Image
                        src={member.user.avatar_url || "/placeholder.svg"}
                        alt={member.user.ff_name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      member.user.ff_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-foreground">{member.user.ff_name}</span>
                      <VerificationBadge type={member.user.verification_type} size="sm" />
                    </div>
                    {member.user.id === group.owner_id && <span className="text-xs text-neon-orange">Dono</span>}
                  </div>
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.sender_id === currentUser.id
          return (
            <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] ${isOwn ? "" : "flex gap-2"}`}>
                {!isOwn && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-orange to-neon-cyan flex items-center justify-center text-background text-sm font-bold overflow-hidden flex-shrink-0">
                    {message.sender.avatar_url ? (
                      <Image
                        src={message.sender.avatar_url || "/placeholder.svg"}
                        alt={message.sender.ff_name}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      message.sender.ff_name.charAt(0).toUpperCase()
                    )}
                  </div>
                )}
                <div
                  className={`${
                    isOwn
                      ? "bg-gradient-to-r from-neon-cyan to-neon-orange text-background"
                      : "bg-secondary text-foreground"
                  } rounded-2xl px-4 py-2`}
                >
                  {!isOwn && (
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-xs font-medium text-neon-cyan">{message.sender.ff_name}</span>
                      <VerificationBadge type={message.sender.verification_type} size="sm" />
                    </div>
                  )}
                  <p className="break-words">{message.content}</p>
                  <p className={`text-xs mt-1 ${isOwn ? "text-background/70" : "text-muted-foreground"}`}>
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-border bg-card/80 backdrop-blur-sm">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="bg-secondary border-border focus:border-neon-cyan"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="bg-gradient-to-r from-neon-orange to-neon-cyan text-background"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </div>
  )
}
