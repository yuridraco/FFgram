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

    // Tentar aceitar por group_members.id primeiro
    const { data: byInviteId, error: inviteError } = await supabase
      .from("group_members")
      .update({ status: "accepted" })
      .eq("id", id)
      .eq("user_id", session.id)
      .eq("status", "pending")
      .select()

    // Se não encontrou, tentar por group_id
    if (!byInviteId || byInviteId.length === 0) {
      const { error } = await supabase
        .from("group_members")
        .update({ status: "accepted" })
        .eq("group_id", id)
        .eq("user_id", session.id)
        .eq("status", "pending")

      if (error) {
        return NextResponse.json({ error: "Erro ao aceitar convite" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao aceitar convite:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
