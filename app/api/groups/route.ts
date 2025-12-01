import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { name, description, memberIds } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nome do grupo é obrigatório" }, { status: 400 })
    }

    const supabase = await createClient()

    // Criar grupo
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        owner_id: session.id,
      })
      .select()
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: "Erro ao criar grupo" }, { status: 500 })
    }

    // Adicionar criador como membro admin
    await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: session.id,
      status: "accepted",
      role: "admin",
    })

    // Enviar convites para membros selecionados
    if (memberIds && memberIds.length > 0) {
      const invites = memberIds.map((userId: string) => ({
        group_id: group.id,
        user_id: userId,
        status: "pending",
        role: "member",
      }))

      await supabase.from("group_members").insert(invites)
    }

    return NextResponse.json({ success: true, group })
  } catch (error) {
    console.error("Erro ao criar grupo:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
