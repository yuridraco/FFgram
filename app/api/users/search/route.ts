import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
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
    .select("id, ff_uid, ff_name, avatar_url, ff_level, verification_type")
    .or(`ff_name.ilike.%${query}%,ff_uid.ilike.%${query}%`)
    .eq("is_banned", false)
    .limit(20)

  return NextResponse.json({ users: users || [] })
}
