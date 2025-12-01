import { notFound } from "next/navigation"
import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { GroupChatClient } from "./group-chat-client"

interface GroupPageProps {
  params: Promise<{ id: string }>
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params
  const session = await getSession()
  if (!session) return null

  const supabase = await createClient()

  // Verificar se o usuário é membro
  const { data: membership } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", id)
    .eq("user_id", session.id)
    .eq("status", "accepted")
    .single()

  if (!membership) {
    notFound()
  }

  // Buscar grupo
  const { data: group } = await supabase
    .from("groups")
    .select(`
      *,
      owner:users!groups_owner_id_fkey (
        id,
        ff_name,
        verification_type
      )
    `)
    .eq("id", id)
    .single()

  if (!group) {
    notFound()
  }

  // Buscar membros
  const { data: members } = await supabase
    .from("group_members")
    .select(`
      user:users (
        id,
        ff_uid,
        ff_name,
        avatar_url,
        verification_type
      ),
      role
    `)
    .eq("group_id", id)
    .eq("status", "accepted")

  // Buscar mensagens
  const { data: messages } = await supabase
    .from("group_messages")
    .select(`
      *,
      sender:users (
        id,
        ff_name,
        avatar_url,
        verification_type
      )
    `)
    .eq("group_id", id)
    .order("created_at", { ascending: true })

  return (
    <GroupChatClient
      group={group}
      members={members || []}
      initialMessages={messages || []}
      currentUser={session}
      isOwner={group.owner_id === session.id}
    />
  )
}
