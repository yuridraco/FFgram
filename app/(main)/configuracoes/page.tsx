import { getSession } from "@/lib/auth"
import { SettingsClient } from "./settings-client"

export default async function SettingsPage() {
  const session = await getSession()
  if (!session) return null

  return <SettingsClient currentUser={session} />
}
