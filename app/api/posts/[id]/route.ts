import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()

    // Verificar se o post existe e se o usuário pode deletar
    const { data: post } = await supabase.from("posts").select("user_id").eq("id", id).single()

    if (!post) {
      return NextResponse.json({ error: "Publicação não encontrada" }, { status: 404 })
    }

    const isOwner = session.verification_type === "owner"
    const isPostOwner = post.user_id === session.id

    if (!isOwner && !isPostOwner) {
      return NextResponse.json({ error: "Sem permissão para excluir" }, { status: 403 })
    }

    const { error } = await supabase.from("posts").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: "Erro ao excluir publicação" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar post:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
