import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

// Enviar pedido de amizade
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id: targetUserId } = await params

    if (targetUserId === session.id) {
      return NextResponse.json({ error: "Você não pode adicionar a si mesmo" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar se já existe amizade
    const { data: existing } = await supabase
      .from("friendships")
      .select("*")
      .or(
        `and(requester_id.eq.${session.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${session.id})`,
      )
      .single()

    if (existing) {
      return NextResponse.json({ error: "Já existe uma solicitação de amizade" }, { status: 400 })
    }

    const { error } = await supabase.from("friendships").insert({
      requester_id: session.id,
      addressee_id: targetUserId,
      status: "pending",
    })

    if (error) {
      return NextResponse.json({ error: "Erro ao enviar solicitação" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao adicionar amigo:", error)
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

    // Tenta deletar por friendshipId primeiro
    const { data: byId } = await supabase
      .from("friendships")
      .delete()
      .eq("id", id)
      .or(`requester_id.eq.${session.id},addressee_id.eq.${session.id}`)
      .select()

    // Se não encontrou, tenta deletar por userId
    if (!byId || byId.length === 0) {
      await supabase
        .from("friendships")
        .delete()
        .or(
          `and(requester_id.eq.${session.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${session.id})`,
        )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao remover amigo:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
