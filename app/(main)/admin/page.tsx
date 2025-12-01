import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { AdminClient } from "./admin-client"

export default async function AdminPage() {
  const session = await getSession()

  if (!session || session.verification_type !== "owner") {
    redirect("/feed")
  }

  const supabase = await createClient()

  // Estatísticas
  const { count: usersCount } = await supabase.from("users").select("*", { count: "exact", head: true })
  const { count: postsCount } = await supabase.from("posts").select("*", { count: "exact", head: true })
  const { count: bannedCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("is_banned", true)

  // Usuários recentes
  const { data: recentUsers } = await supabase
    .from("users")
    .select("id, ff_uid, ff_name, avatar_url, verification_type, is_banned, created_at")
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <AdminClient
      stats={{
        users: usersCount || 0,
        posts: postsCount || 0,
        banned: bannedCount || 0,
      }}
      recentUsers={recentUsers || []}
    />
  )
}
