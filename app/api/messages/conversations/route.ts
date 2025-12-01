import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const supabase = await createClient()

  // Buscar conversas
  const { data: convParticipants } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", session.id)

  const conversations = await Promise.all(
    (convParticipants || []).map(async (conv) => {
      const { data: participants } = await supabase
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

  // Buscar grupos
  const { data: groupMembers } = await supabase
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

  const groups = await Promise.all(
    (groupMembers || []).map(async (g) => {
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

  // Buscar convites pendentes
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

  return NextResponse.json({
    conversations: conversations.filter((c) => c.otherUser),
    groups,
    pendingInvites: pendingInvites || [],
  })
}
