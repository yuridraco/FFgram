import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/auth"
import { verifyFFAccount } from "@/lib/free-fire-api"

export async function POST() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const ffData = await verifyFFAccount(session.ff_uid)

    if (!ffData) {
      return NextResponse.json({ error: "Erro ao buscar dados do Free Fire" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        ff_name: ffData.AccountInfo.AccountName,
        ff_level: ffData.AccountInfo.AccountLevel,
        ff_likes: ffData.AccountInfo.AccountLikes,
        ff_guild_name: ffData.GuildInfo?.GuildName || null,
        ff_guild_level: ffData.GuildInfo?.GuildLevel || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, user: updatedUser })
  } catch {
    return NextResponse.json({ error: "Erro ao sincronizar" }, { status: 500 })
  }
}
