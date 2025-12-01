export interface FFAccountInfo {
  AccountInfo: {
    AccountName: string
    AccountLevel: number
    AccountLikes: number
    BrMaxRank: number
    BrRankPoint: number
  }
  GuildInfo: {
    GuildName: string
    GuildLevel: number
    GuildMember: number
  } | null
  petInfo: {
    level: number
    skinId: number
  } | null
}

export async function verifyFFAccount(uid: string): Promise<FFAccountInfo | null> {
  try {
    const response = await fetch(`https://api-info-51.vercel.app/get?uid=${uid}&region=BR`)

    if (!response.ok) return null

    const data = await response.json()

    if (!data.AccountInfo || !data.AccountInfo.AccountName) {
      return null
    }

    return data as FFAccountInfo
  } catch {
    return null
  }
}
