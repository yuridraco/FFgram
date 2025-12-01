import { cookies } from "next/headers"
import { createClient } from "./supabase/server"

const OWNER_UID = "130098219"

export interface User {
  id: string
  ff_uid: string
  ff_name: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  ff_level: number
  ff_likes: number
  ff_guild_name: string | null
  ff_guild_level: number | null
  verification_type: "owner" | "bot" | "verified" | "vip" | "pro" | null
  is_banned: boolean
  created_at: string
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("ff_session")?.value

  if (!sessionToken) return null

  try {
    const supabase = await createClient()
    const { data: user } = await supabase.from("users").select("*").eq("id", sessionToken).single()

    return user
  } catch {
    return null
  }
}

export async function updateSession(user: User): Promise<void> {
  // A sessão é baseada no ID do usuário, então não precisamos atualizar o cookie
  // Os dados atualizados serão buscados do banco na próxima chamada de getSession
  return
}

export function isOwner(user: User | null): boolean {
  return user?.ff_uid === OWNER_UID || user?.verification_type === "owner" || user?.verification_type === "pro"
}
