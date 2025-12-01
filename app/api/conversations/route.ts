import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "ID do usuário é obrigatório" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar se já existe conversa entre os dois
    const { data: existingConvs } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", session.id)

    if (existingConvs) {
      for (const conv of existingConvs) {
        const { data: otherParticipant } = await supabase
          .from("conversation_participants")
          .select("*")
          .eq("conversation_id", conv.conversation_id)
          .eq("user_id", userId)
          .single()

        if (otherParticipant) {
          return NextResponse.json({
            conversationId: conv.conversation_id,
            existing: true,
          })
        }
      }
    }

    // Criar nova conversa
    const { data: conversation, error: convError } = await supabase.from("conversations").insert({}).select().single()

    if (convError || !conversation) {
      return NextResponse.json({ error: "Erro ao criar conversa" }, { status: 500 })
    }

    // Adicionar participantes
    await supabase.from("conversation_participants").insert([
      { conversation_id: conversation.id, user_id: session.id },
      { conversation_id: conversation.id, user_id: userId },
    ])

    return NextResponse.json({
      conversationId: conversation.id,
      existing: false,
    })
  } catch (error) {
    console.error("Erro ao criar conversa:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
