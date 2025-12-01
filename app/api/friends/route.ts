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

    const { data: friendships } = await supabase
      .from("friendships")
      .select(`
        requester_id,
        addressee_id,
        requester:users!friendships_requester_id_fkey (
          id,
          ff_uid,
          ff_name,
          display_name,
          avatar_url,
          verification_type
        ),
        addressee:users!friendships_addressee_id_fkey (
          id,
          ff_uid,
          ff_name,
          display_name,
          avatar_url,
          verification_type
        )
      `)
      .or(`requester_id.eq.${session.id},addressee_id.eq.${session.id}`)
      .eq("status", "accepted")

    const friends = (friendships || []).map((f) => (f.requester_id === session.id ? f.addressee : f.requester))

    return NextResponse.json({ friends })
  } catch (error) {
    console.error("Erro ao buscar amigos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
