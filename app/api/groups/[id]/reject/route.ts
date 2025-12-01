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

    // Tentar deletar por group_members.id primeiro
    const { data: byInviteId } = await supabase
      .from("group_members")
      .delete()
      .eq("id", id)
      .eq("user_id", session.id)
      .eq("status", "pending")
      .select()

    // Se não encontrou, tentar por group_id
    if (!byInviteId || byInviteId.length === 0) {
      await supabase.from("group_members").delete().eq("group_id", id).eq("user_id", session.id).eq("status", "pending")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao rejeitar convite:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
