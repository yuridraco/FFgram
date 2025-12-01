import { notFound } from "next/navigation"
import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { ChatClient } from "./chat-client"

interface ChatPageProps {
  params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params
  const session = await getSession()
  if (!session) return null

  const supabase = await createClient()

  // Verificar se o usuário é participante
  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("*")
    .eq("conversation_id", id)
    .eq("user_id", session.id)
    .single()

  if (!participant) {
    notFound()
  }

  // Buscar outro participante com display_name
  const { data: otherParticipant } = await supabase
    .from("conversation_participants")
    .select(`
      user:users (
        id,
        ff_uid,
        ff_name,
        display_name,
        avatar_url,
        verification_type
      )
    `)
    .eq("conversation_id", id)
    .neq("user_id", session.id)
    .single()

  // Buscar mensagens com display_name
  const { data: messages } = await supabase
    .from("messages")
    .select(`
      *,
      sender:users (
        id,
        ff_name,
        display_name,
        avatar_url,
        verification_type
      )
    `)
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })

  return (
    <ChatClient
      conversationId={id}
      otherUser={otherParticipant?.user}
      initialMessages={messages || []}
      currentUser={session}
    />
  )
}
