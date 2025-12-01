import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { FriendsClient } from "./friends-client"

export default async function FriendsPage() {
  const session = await getSession()
  if (!session) return null

  const supabase = await createClient()

  // Buscar amigos aceitos
  const { data: friendships } = await supabase
    .from("friendships")
    .select(`
      *,
      requester:users!friendships_requester_id_fkey (
        id, ff_uid, ff_name, avatar_url, ff_level, verification_type
      ),
      addressee:users!friendships_addressee_id_fkey (
        id, ff_uid, ff_name, avatar_url, ff_level, verification_type
      )
    `)
    .or(`requester_id.eq.${session.id},addressee_id.eq.${session.id}`)
    .eq("status", "accepted")

  // Buscar pedidos pendentes
  const { data: pendingRequests } = await supabase
    .from("friendships")
    .select(`
      *,
      requester:users!friendships_requester_id_fkey (
        id, ff_uid, ff_name, avatar_url, ff_level, verification_type
      )
    `)
    .eq("addressee_id", session.id)
    .eq("status", "pending")

  const friends = (friendships || []).map((f) => {
    const friend = f.requester_id === session.id ? f.addressee : f.requester
    return { ...friend, friendship_id: f.id }
  })

  return <FriendsClient currentUser={session} initialFriends={friends} initialPendingRequests={pendingRequests || []} />
}
