import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { PostDetailClient } from "./post-detail-client"

export default async function PostPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) redirect("/login")

  const supabase = await createClient()

  // Buscar o post com informações do usuário
  const { data: post } = await supabase
    .from("posts")
    .select(
      `
      *,
      user:users!posts_user_id_fkey (
        id,
        ff_uid,
        ff_name,
        display_name,
        avatar_url,
        verification_type
      )
    `,
    )
    .eq("id", params.id)
    .single()

  if (!post) {
    redirect("/feed")
  }

  // Verificar se o usuário curtiu o post
  const { data: like } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", post.id)
    .eq("user_id", session.id)
    .single()

  // Buscar comentários do post
  const { data: comments } = await supabase
    .from("comments")
    .select(
      `
      *,
      user:users!comments_user_id_fkey (
        id,
        ff_uid,
        ff_name,
        display_name,
        avatar_url,
        verification_type
      )
    `,
    )
    .eq("post_id", params.id)
    .order("created_at", { ascending: true })

  return (
    <PostDetailClient
      post={{ ...post, is_liked: !!like }}
      comments={comments || []}
      currentUserId={session.id}
      currentUserAvatar={session.avatar_url}
    />
  )
}
