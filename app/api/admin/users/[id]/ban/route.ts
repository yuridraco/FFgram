import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.verification_type !== "owner") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { id } = await params
  const { ban } = await request.json()

  const supabase = await createClient()

  const { error } = await supabase.from("users").update({ is_banned: ban }).eq("id", id)

  if (error) {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
