import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSession, updateSession } from "@/lib/auth"

export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { bio, avatar_url, display_name } = await request.json()

    const supabase = await createClient()

    // Atualizar no banco de dados
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        bio: bio?.slice(0, 200),
        avatar_url,
        display_name: display_name?.slice(0, 30) || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id)
      .select()
      .single()

    if (error) throw error

    // Atualizar a sessão com os novos dados
    await updateSession({
      ...session,
      bio: updatedUser.bio,
      avatar_url: updatedUser.avatar_url,
      display_name: updatedUser.display_name,
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error)
    return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 })
  }
}
