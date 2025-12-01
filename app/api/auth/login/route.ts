import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { verifyPassword } from "@/lib/password"

export async function POST(request: NextRequest) {
  try {
    const { uid, password } = await request.json()

    if (!uid || !password) {
      return NextResponse.json({ error: "UID e senha são obrigatórios" }, { status: 400 })
    }

    const supabase = await createClient()

    // Buscar usuário pelo UID
    const { data: user, error } = await supabase.from("users").select("*").eq("ff_uid", uid).single()

    if (error || !user) {
      return NextResponse.json({ error: "UID ou senha incorretos" }, { status: 401 })
    }

    // Verificar se está banido
    if (user.is_banned) {
      return NextResponse.json({ error: "Esta conta foi banida" }, { status: 403 })
    }

    // Verificar senha
    const isValidPassword = await verifyPassword(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json({ error: "UID ou senha incorretos" }, { status: 401 })
    }

    // Criar sessão via cookie
    const cookieStore = await cookies()
    cookieStore.set("ff_session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: "/",
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        ff_name: user.ff_name,
        ff_uid: user.ff_uid,
      },
    })
  } catch (error) {
    console.error("Erro no login:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
