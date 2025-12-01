import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.verification_type !== "owner") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")

  if (!query) {
    return NextResponse.json({ users: [] })
  }

  const supabase = await createClient()

  const { data: users } = await supabase
    .from("users")
    .select("id, ff_uid, ff_name, avatar_url, verification_type, is_banned, created_at")
    .or(`ff_name.ilike.%${query}%,ff_uid.ilike.%${query}%`)
    .limit(50)

  return NextResponse.json({ users: users || [] })
}
