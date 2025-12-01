import { notFound } from "next/navigation"
import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { ProfileClient } from "./profile-client"

interface ProfilePageProps {
  params: Promise<{ uid: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { uid } = await params
  const session = await getSession()
  if (!session) return null

  const supabase = await createClient()

  // Buscar usuário pelo UID do Free Fire
  const { data: profileUser } = await supabase.from("users").select("*").eq("ff_uid", uid).single()

  if (!profileUser) {
    notFound()
  }

  // Buscar posts do usuário
  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      user:users!posts_user_id_fkey (
        id,
        ff_uid,
        ff_name,
        avatar_url,
        verification_type
      ),
      post_likes!left (
        user_id
      )
    `)
    .eq("user_id", profileUser.id)
    .order("created_at", { ascending: false })

  // Verificar se são amigos
  const { data: friendship } = await supabase
    .from("friendships")
    .select("*")
    .or(
      `and(requester_id.eq.${session.id},addressee_id.eq.${profileUser.id}),and(requester_id.eq.${profileUser.id},addressee_id.eq.${session.id})`,
    )
    .single()

  // Contar amigos
  const { count: friendsCount } = await supabase
    .from("friendships")
    .select("*", { count: "exact", head: true })
    .or(`requester_id.eq.${profileUser.id},addressee_id.eq.${profileUser.id}`)
    .eq("status", "accepted")

  // Contar posts
  const { count: postsCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profileUser.id)

  const formattedPosts = (posts || []).map((post) => ({
    ...post,
    user: post.user,
    is_liked: post.post_likes?.some((like: { user_id: string }) => like.user_id === session.id),
  }))

  return (
    <ProfileClient
      profileUser={profileUser}
      posts={formattedPosts}
      currentUser={session}
      friendshipStatus={friendship?.status || null}
      friendshipRequesterId={friendship?.requester_id || null}
      friendsCount={friendsCount || 0}
      postsCount={postsCount || 0}
    />
  )
}
