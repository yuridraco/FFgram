import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()

    // Adicionar like
    const { error: likeError } = await supabase.from("post_likes").insert({
      post_id: id,
      user_id: session.id,
    })

    if (likeError && likeError.code !== "23505") {
      // 23505 = unique violation (já curtiu)
      return NextResponse.json({ error: "Erro ao curtir" }, { status: 500 })
    }

    // Atualizar contador
    await supabase.rpc("increment_likes", { post_id: id })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao curtir:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()

    // Remover like
    const { error } = await supabase.from("post_likes").delete().eq("post_id", id).eq("user_id", session.id)

    if (error) {
      return NextResponse.json({ error: "Erro ao descurtir" }, { status: 500 })
    }

    // Atualizar contador
    await supabase.rpc("decrement_likes", { post_id: id })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao descurtir:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
