import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { GroupsClient } from "./groups-client"

export default async function GroupsPage() {
  const session = await getSession()
  if (!session) return null

  const supabase = await createClient()

  // Buscar grupos do usuário
  const { data: userGroups } = await supabase
    .from("group_members")
    .select(`
      group:groups (
        id,
        name,
        avatar_url,
        description,
        owner_id
      ),
      status
    `)
    .eq("user_id", session.id)
    .eq("status", "accepted")

  const { data: pendingInvites } = await supabase
    .from("group_members")
    .select(`
      id,
      group_id,
      group:groups (
        id,
        name,
        avatar_url,
        description,
        owner_id,
        owner:users!groups_owner_id_fkey (
          ff_name
        )
      )
    `)
    .eq("user_id", session.id)
    .eq("status", "pending")

  const groups = (userGroups || []).map((g) => g.group).filter(Boolean)

  // Mapear invites com o ID correto (group_member.id)
  const invites = (pendingInvites || []).map((inv) => ({
    id: inv.id, // Este é o group_member.id
    group_id: inv.group_id,
    ...inv.group,
  }))

  return <GroupsClient currentUser={session} initialGroups={groups} initialInvites={invites} />
}
