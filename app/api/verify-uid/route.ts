import { type NextRequest, NextResponse } from "next/server"
import { verifyFFAccount } from "@/lib/free-fire-api"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const uid = searchParams.get("uid")

  if (!uid) {
    return NextResponse.json({ error: "UID é obrigatório" }, { status: 400 })
  }

  const ffData = await verifyFFAccount(uid)

  if (!ffData) {
    return NextResponse.json({ error: "UID não encontrado ou inválido" }, { status: 404 })
  }

  return NextResponse.json({
    name: ffData.AccountInfo.AccountName,
    level: ffData.AccountInfo.AccountLevel,
    likes: ffData.AccountInfo.AccountLikes,
    guild: ffData.GuildInfo?.GuildName || null,
    guildLevel: ffData.GuildInfo?.GuildLevel || null,
  })
}
