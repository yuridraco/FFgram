import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const supabase = await createClient()

    // Contar pedidos pendentes
    const { count } = await supabase
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .eq("addressee_id", session.id)
      .eq("status", "pending")

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error("Erro ao buscar pedidos pendentes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
