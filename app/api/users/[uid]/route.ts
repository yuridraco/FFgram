import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/auth"
import { verifyFFAccount } from "@/lib/free-fire-api"

export async function GET(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { uid } = await params
  const supabase = await createClient()

  // Buscar usuário
  const { data: user } = await supabase.from("users").select("*").eq("ff_uid", uid).single()

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
  }

  // Atualizar dados do FF automaticamente
  try {
    const ffInfo = await verifyFFAccount(uid)
    if (ffInfo) {
      await supabase
        .from("users")
        .update({
          ff_name: ffInfo.AccountInfo.AccountName,
          ff_level: ffInfo.AccountInfo.AccountLevel,
          ff_likes: ffInfo.AccountInfo.AccountLikes,
          ff_guild_name: ffInfo.GuildInfo?.GuildName || null,
          ff_guild_level: ffInfo.GuildInfo?.GuildLevel || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      user.ff_name = ffInfo.AccountInfo.AccountName
      user.ff_level = ffInfo.AccountInfo.AccountLevel
      user.ff_likes = ffInfo.AccountInfo.AccountLikes
      user.ff_guild_name = ffInfo.GuildInfo?.GuildName || null
      user.ff_guild_level = ffInfo.GuildInfo?.GuildLevel || null
    }
  } catch (error) {
    console.error("Erro ao atualizar FF:", error)
  }

  // Contar amigos
  const { count: friendsCount } = await supabase
    .from("friendships")
    .select("*", { count: "exact", head: true })
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq("status", "accepted")

  // Contar posts
  const { count: postsCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  return NextResponse.json({
    user,
    friendsCount: friendsCount || 0,
    postsCount: postsCount || 0,
  })
}
