import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { verifyFFAccount } from "@/lib/free-fire-api"
import { hashPassword } from "@/lib/password"

const OWNER_UID = "130098219"

export async function POST(request: NextRequest) {
  try {
    const { uid, password } = await request.json()

    if (!uid || !password) {
      return NextResponse.json({ error: "UID e senha são obrigatórios" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    // Verificar se o UID é válido na API do Free Fire
    const ffData = await verifyFFAccount(uid)

    if (!ffData) {
      return NextResponse.json({ error: "UID do Free Fire inválido ou não encontrado" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar se já existe conta com esse UID
    const { data: existingUser } = await supabase.from("users").select("id").eq("ff_uid", uid).single()

    if (existingUser) {
      return NextResponse.json({ error: "Já existe uma conta com esse UID" }, { status: 400 })
    }

    // Determinar tipo de verificação
    let verificationType: "pro" | null = null
    let isOwner = false
    if (uid === OWNER_UID) {
      verificationType = "pro"
      isOwner = true
    }

    // Criar hash da senha
    const passwordHash = await hashPassword(password)

    // Criar usuário
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        ff_uid: uid,
        ff_name: ffData.AccountInfo.AccountName,
        password_hash: passwordHash,
        ff_level: ffData.AccountInfo.AccountLevel,
        ff_likes: ffData.AccountInfo.AccountLikes,
        ff_guild_name: ffData.GuildInfo?.GuildName || null,
        ff_guild_level: ffData.GuildInfo?.GuildLevel || null,
        verification_type: verificationType,
        is_owner: isOwner,
      })
      .select()
      .single()

    if (insertError || !newUser) {
      console.error("Erro ao criar usuário:", insertError)
      return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 })
    }

    // Criar sessão via cookie
    const cookieStore = await cookies()
    cookieStore.set("ff_session", newUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: "/",
    })

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        ff_name: newUser.ff_name,
        ff_uid: newUser.ff_uid,
      },
    })
  } catch (error) {
    console.error("Erro no cadastro:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
