"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { VerificationBadge } from "@/components/ui/verification-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { User } from "@/lib/auth"
import { ArrowLeft, Send, Phone, Video, MoreVertical } from "lucide-react"

interface MessageSender {
  id: string
  ff_name: string
  display_name?: string
  avatar_url: string | null
  verification_type: "owner" | "bot" | "verified" | "vip" | "pro" | null
}

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  sender: MessageSender
}

interface OtherUser {
  id: string
  ff_uid: string
  ff_name: string
  display_name?: string
  avatar_url: string | null
  verification_type: "owner" | "bot" | "verified" | "vip" | "pro" | null
}

interface ChatClientProps {
  conversationId: string
  otherUser: OtherUser | null
  initialMessages: Message[]
  currentUser: User
}

export function ChatClient({ conversationId, otherUser, initialMessages, currentUser }: ChatClientProps) {
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
        const res = await fetch(`/api/messages/${conversationId}`)
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages)
        }
      } catch (error) {
        console.error("Erro ao buscar mensagens:", error)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [conversationId])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    const messageContent = newMessage
    setNewMessage("")

    // Adicionar mensagem otimista
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      created_at: new Date().toISOString(),
      sender_id: currentUser.id,
      sender: {
        id: currentUser.id,
        ff_name: currentUser.ff_name,
        display_name: currentUser.display_name || undefined,
        avatar_url: currentUser.avatar_url,
        verification_type: currentUser.verification_type,
      },
    }
    setMessages((prev) => [...prev, optimisticMessage])

    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => prev.map((m) => (m.id === optimisticMessage.id ? data.message : m)))
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id))
      setNewMessage(messageContent)
    } finally {
      setIsSending(false)
    }
  }

  // Formatar hora
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-screen max-w-2xl mx-auto bg-background">
      {/* Header estilo WhatsApp */}
      <div className="flex items-center gap-3 p-3 bg-card border-b border-border">
        <Link href="/mensagens">
          <Button variant="ghost" size="icon" className="text-muted-foreground md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <Link href={`/perfil/${otherUser?.ff_uid}`} className="flex items-center gap-3 flex-1">
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-neon-orange to-neon-cyan p-[2px]">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                {otherUser?.avatar_url ? (
                  <Image
                    src={otherUser.avatar_url || "/placeholder.svg"}
                    alt={otherUser.ff_name}
                    width={44}
                    height={44}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-neon-cyan">{otherUser?.ff_name.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-neon-green rounded-full border-2 border-card" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground">{otherUser?.display_name || otherUser?.ff_name}</span>
              <VerificationBadge type={otherUser?.verification_type || null} size="sm" />
            </div>
            <span className="text-xs text-neon-green">online</span>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages - estilo WhatsApp com fundo preto sólido */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-black">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-center">
              Nenhuma mensagem ainda.
              <br />
              Diga oi!
            </p>
          </div>
        )}
        {messages.map((message, index) => {
          const isOwn = message.sender_id === currentUser.id
          const showAvatar = !isOwn && (index === 0 || messages[index - 1].sender_id !== message.sender_id)

          return (
            <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} items-end gap-2`}>
              {!isOwn && showAvatar && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-orange to-neon-cyan p-[1px] flex-shrink-0">
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                    {message.sender.avatar_url ? (
                      <Image
                        src={message.sender.avatar_url || "/placeholder.svg"}
                        alt={message.sender.ff_name}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-neon-cyan">
                        {message.sender.ff_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {!isOwn && !showAvatar && <div className="w-8" />}
              <div
                className={`max-w-[75%] relative ${
                  isOwn
                    ? "bg-gradient-to-br from-neon-cyan/90 to-neon-orange/90 text-background rounded-2xl rounded-br-md"
                    : "bg-card text-foreground rounded-2xl rounded-bl-md border border-border"
                } px-4 py-2 shadow-md`}
              >
                <p className="break-words text-[15px]">{message.content}</p>
                <p className={`text-[10px] mt-1 text-right ${isOwn ? "text-background/70" : "text-muted-foreground"}`}>
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input estilo WhatsApp */}
      <form onSubmit={handleSend} className="p-3 bg-card border-t border-border">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Mensagem..."
              className="bg-secondary border-none rounded-full pl-4 pr-4 py-6 focus-visible:ring-1 focus-visible:ring-neon-cyan"
            />
          </div>
          <Button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            size="icon"
            className="w-12 h-12 rounded-full bg-gradient-to-r from-neon-orange to-neon-cyan text-background hover:opacity-90"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </div>
  )
}
