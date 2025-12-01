import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

// Buscar mensagens
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()

    // Verificar se é participante
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("*")
      .eq("conversation_id", id)
      .eq("user_id", session.id)
      .single()

    if (!participant) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    const { data: messages } = await supabase
      .from("messages")
      .select(`
        *,
        sender:users (
          id,
          ff_name,
          display_name,
          avatar_url,
          verification_type
        )
      `)
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// Enviar mensagem
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

    // Verificar se é participante
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("*")
      .eq("conversation_id", id)
      .eq("user_id", session.id)
      .single()

    if (!participant) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: id,
        sender_id: session.id,
        content: content.trim(),
      })
      .select(`
        *,
        sender:users (
          id,
          ff_name,
          display_name,
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
