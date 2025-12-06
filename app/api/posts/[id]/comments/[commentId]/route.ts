import { NextRequest, NextResponse } from "next/server"
import { getSession, isOwner } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } },
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const supabase = await createClient()

    // Buscar o comentário para verificar permissões
    const { data: comment } = await supabase
      .from("comments")
      .select("user_id, post_id")
      .eq("id", params.commentId)
      .single()

    if (!comment) {
      return NextResponse.json({ error: "Comentário não encontrado" }, { status: 404 })
    }

    // Verificar se o usuário pode deletar (dono do comentário ou admin)
    if (comment.user_id !== session.id && !isOwner(session)) {
      return NextResponse.json({ error: "Sem permissão para deletar este comentário" }, { status: 403 })
    }

    // Deletar o comentário
    const { error } = await supabase.from("comments").delete().eq("id", params.commentId)

    if (error) {
      console.error("Erro ao deletar comentário:", error)
      return NextResponse.json({ error: "Erro ao deletar comentário" }, { status: 500 })
    }

    // Decrementar contador de comentários do post
    await supabase.rpc("decrement_comments", { post_id: comment.post_id })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao processar deleção:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
