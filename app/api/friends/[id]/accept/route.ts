import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id: friendshipId } = await params
    const supabase = await createClient()

    // Aceitar por friendshipId
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId)
      .eq("addressee_id", session.id)
      .eq("status", "pending")

    if (error) {
      return NextResponse.json({ error: "Erro ao aceitar solicitação" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao aceitar amizade:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
