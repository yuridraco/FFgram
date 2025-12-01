import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

// Buscar mensagens do grupo
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()

    // Verificar se é membro
    const { data: member } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", id)
      .eq("user_id", session.id)
      .eq("status", "accepted")
      .single()

    if (!member) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    const { data: messages } = await supabase
      .from("group_messages")
      .select(`
        *,
        sender:users (
          id,
          ff_name,
          avatar_url,
          verification_type
        )
      `)
      .eq("group_id", id)
      .order("created_at", { ascending: true })

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// Enviar mensagem no grupo
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: "Conteúdo é obrigatório" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar se é membro
    const { data: member } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", id)
      .eq("user_id", session.id)
      .eq("status", "accepted")
      .single()

    if (!member) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    const { data: message, error } = await supabase
      .from("group_messages")
      .insert({
        group_id: id,
        sender_id: session.id,
        content: content.trim(),
      })
      .select(`
        *,
        sender:users (
          id,
          ff_name,
          avatar_url,
          verification_type
        )
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 })
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
