import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "ID do usuário é obrigatório" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar se são amigos mútuos
    const { data: friendship } = await supabase
      .from("friendships")
      .select("*")
      .or(
        `and(requester_id.eq.${session.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${session.id})`,
      )
      .eq("status", "accepted")
      .single()

    if (!friendship) {
      return NextResponse.json({ error: "Vocês precisam ser amigos para conversar" }, { status: 403 })
    }

    // Buscar todas as conversas do usuário atual
    const { data: myConversations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", session.id)

    if (myConversations && myConversations.length > 0) {
      const convIds = myConversations.map((c) => c.conversation_id)

      // Verificar se o outro usuário está em alguma dessas conversas
      const { data: existingConv } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", userId)
        .in("conversation_id", convIds)
        .limit(1)

      if (existingConv && existingConv.length > 0) {
        return NextResponse.json({ conversationId: existingConv[0].conversation_id })
      }
    }

    // Criar nova conversa
    const { data: newConv, error: convError } = await supabase.from("conversations").insert({}).select().single()

    if (convError) {
      console.error("Erro ao criar conversa:", convError)
      return NextResponse.json({ error: "Erro ao criar conversa" }, { status: 500 })
    }

    // Adicionar participantes
    const { error: partError } = await supabase.from("conversation_participants").insert([
      { conversation_id: newConv.id, user_id: session.id },
      { conversation_id: newConv.id, user_id: userId },
    ])

    if (partError) {
      console.error("Erro ao adicionar participantes:", partError)
      return NextResponse.json({ error: "Erro ao criar conversa" }, { status: 500 })
    }

    return NextResponse.json({ conversationId: newConv.id })
  } catch (error) {
    console.error("Erro ao iniciar conversa:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
