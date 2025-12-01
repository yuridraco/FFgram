import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const supabase = await createClient()

    const { data: posts } = await supabase
      .from("posts")
      .select(`
        *,
        user:users (
          id,
          ff_uid,
          ff_name,
          display_name,
          avatar_url,
          verification_type
        )
      `)
      .order("created_at", { ascending: false })
      .limit(50)

    // Verificar quais posts o usuário curtiu
    const postIds = posts?.map((p) => p.id) || []
    const { data: userLikes } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", session.id)
      .in("post_id", postIds)

    const likedPostIds = new Set(userLikes?.map((l) => l.post_id) || [])

    const postsWithLikes = posts?.map((post) => ({
      ...post,
      is_liked: likedPostIds.has(post.id),
    }))

    return NextResponse.json({ posts: postsWithLikes || [] })
  } catch (error) {
    console.error("Erro ao buscar posts:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const content = formData.get("content") as string
    const media = formData.get("media") as File | null
    const mediaType = formData.get("mediaType") as "image" | "video" | null

    if (!content?.trim() && !media) {
      return NextResponse.json({ error: "Conteúdo ou mídia é obrigatório" }, { status: 400 })
    }

    const supabase = await createClient()

    let mediaUrl: string | null = null

    if (media) {
      const fileExt = media.name.split(".").pop()
      const fileName = `posts/${session.id}/${Date.now()}.${fileExt}`

      const blob = await put(fileName, media, {
        access: "public",
      })

      mediaUrl = blob.url
    }

    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        user_id: session.id,
        content: content?.trim() || null,
        media_url: mediaUrl,
        media_type: media ? mediaType : null,
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar post:", error)
      return NextResponse.json({ error: "Erro ao criar publicação" }, { status: 500 })
    }

    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error("Erro na API de posts:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
