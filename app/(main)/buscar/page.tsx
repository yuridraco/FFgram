import { getSession } from "@/lib/auth"
import { SearchClient } from "./search-client"

export default async function SearchPage() {
  const session = await getSession()
  if (!session) return null

  return <SearchClient currentUser={session} />
}
