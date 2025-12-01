import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { MessagesClient } from "./messages-client"

export default async function MensagensPage() {
  const session = await getSession()
  if (!session) return null

  const supabase = await createClient()

  // Buscar conversas do usuário
  const { data: conversations } = await supabase
    .from("conversation_participants")
    .select(`
      conversation_id,
      conversations!inner (
        id,
        created_at
      )
    `)
    .eq("user_id", session.id)

  // Para cada conversa, buscar o outro participante e última mensagem
  const conversationsWithDetails = await Promise.all(
    (conversations || []).map(async (conv) => {
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select(`
          user:users (
            id,
            ff_uid,
            ff_name,
            avatar_url,
            verification_type
          )
        `)
        .eq("conversation_id", conv.conversation_id)
        .neq("user_id", session.id)
        .single()

      const { data: lastMessage } = await supabase
        .from("messages")
        .select("content, created_at, sender_id")
        .eq("conversation_id", conv.conversation_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      return {
        id: conv.conversation_id,
        otherUser: participants?.user,
        lastMessage,
      }
    }),
  )

  // Buscar grupos do usuário
  const { data: groups } = await supabase
    .from("group_members")
    .select(`
      group:groups (
        id,
        name,
        avatar_url,
        owner_id
      )
    `)
    .eq("user_id", session.id)
    .eq("status", "accepted")

  // Para cada grupo, buscar última mensagem
  const groupsWithDetails = await Promise.all(
    (groups || []).map(async (g) => {
      const { data: lastMessage } = await supabase
        .from("group_messages")
        .select(`
          content,
          created_at,
          sender:users (ff_name)
        `)
        .eq("group_id", g.group!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      return {
        ...g.group,
        lastMessage,
      }
    }),
  )

  // Buscar convites pendentes de grupo
  const { data: pendingInvites } = await supabase
    .from("group_members")
    .select(`
      group:groups (
        id,
        name,
        avatar_url,
        owner:users!groups_owner_id_fkey (ff_name)
      )
    `)
    .eq("user_id", session.id)
    .eq("status", "pending")

  return (
    <MessagesClient
      conversations={conversationsWithDetails.filter((c) => c.otherUser)}
      groups={groupsWithDetails}
      pendingInvites={pendingInvites || []}
      currentUser={session}
    />
  )
}
