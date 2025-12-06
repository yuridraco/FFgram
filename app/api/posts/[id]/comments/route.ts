import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { content } = await req.json()

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Conteúdo do comentário é obrigatório" }, { status: 400 })
    }

    const supabase = await createClient()

    // Criar o comentário
    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        post_id: params.id,
        user_id: session.id,
        content: content.trim(),
      })
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
      .single()

    if (error) {
      console.error("Erro ao criar comentário:", error)
      return NextResponse.json({ error: "Erro ao criar comentário" }, { status: 500 })
    }

    // Atualizar contador de comentários do post
    await supabase.rpc("increment_comments", { post_id: params.id })

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Erro ao processar comentário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const { data: comments, error } = await supabase
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

    if (error) {
      console.error("Erro ao buscar comentários:", error)
      return NextResponse.json({ error: "Erro ao buscar comentários" }, { status: 500 })
    }

    return NextResponse.json(comments || [])
  } catch (error) {
    console.error("Erro ao processar requisição:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
