import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { FeedClient } from "./feed-client"

export default async function FeedPage() {
  const session = await getSession()
  if (!session) return null

  const supabase = await createClient()

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
    .order("created_at", { ascending: false })
    .limit(50)

  const formattedPosts = (posts || []).map((post) => ({
    ...post,
    user: post.user,
    is_liked: post.post_likes?.some((like: { user_id: string }) => like.user_id === session.id),
  }))

  return <FeedClient initialPosts={formattedPosts} currentUser={session} />
}
