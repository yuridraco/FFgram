"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VerificationBadge } from "@/components/ui/verification-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Users, FileText, Ban, Search, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AdminUser {
  id: string
  ff_uid: string
  ff_name: string
  avatar_url: string | null
  verification_type: "owner" | "bot" | "verified" | null
  is_banned: boolean
  created_at: string
}

interface AdminStats {
  users: number
  posts: number
  banned: number
}

export function AdminClient({ stats, recentUsers }: { stats: AdminStats; recentUsers: AdminUser[] }) {
  const [users, setUsers] = useState(recentUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<AdminUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)

    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setSearchResults(data.users || [])
    } catch {
      toast.error("Erro na busca")
    } finally {
      setIsSearching(false)
    }
  }

  const handleBanUser = async (userId: string, ban: boolean) => {
    setActionLoading(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ban }),
      })

      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_banned: ban } : u)))
        setSearchResults((prev) => prev.map((u) => (u.id === userId ? { ...u, is_banned: ban } : u)))
        toast.success(ban ? "Usuário banido" : "Usuário desbanido")
      }
    } catch {
      toast.error("Erro ao executar ação")
    } finally {
      setActionLoading(null)
    }
  }

  const handleVerification = async (userId: string, type: string | null) => {
    setActionLoading(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verification_type: type === "none" ? null : type }),
      })

      if (res.ok) {
        const newType = type === "none" ? null : (type as "owner" | "bot" | "verified")
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, verification_type: newType } : u)))
        setSearchResults((prev) => prev.map((u) => (u.id === userId ? { ...u, verification_type: newType } : u)))
        toast.success("Verificação atualizada")
      }
    } catch {
      toast.error("Erro ao atualizar verificação")
    } finally {
      setActionLoading(null)
    }
  }

  const UserRow = ({ user }: { user: AdminUser }) => (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border ${
        user.is_banned ? "bg-neon-red/5 border-neon-red/20" : "bg-card/80 border-border"
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-orange to-neon-cyan flex items-center justify-center text-background font-bold overflow-hidden">
        {user.avatar_url ? (
          <Image
            src={user.avatar_url || "/placeholder.svg"}
            alt={user.ff_name}
            width={40}
            height={40}
            className="object-cover"
          />
        ) : (
          user.ff_name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-foreground truncate">{user.ff_name}</span>
          <VerificationBadge type={user.verification_type} size="sm" />
          {user.is_banned && <span className="text-xs bg-neon-red/20 text-neon-red px-2 py-0.5 rounded">BANIDO</span>}
        </div>
        <span className="text-xs text-muted-foreground font-mono">{user.ff_uid}</span>
      </div>

      <Select
        defaultValue={user.verification_type || "none"}
        onValueChange={(value) => handleVerification(user.id, value)}
        disabled={actionLoading === user.id}
      >
        <SelectTrigger className="w-32 bg-secondary border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sem Badge</SelectItem>
          <SelectItem value="verified">Verificado</SelectItem>
          <SelectItem value="bot">Bot</SelectItem>
          <SelectItem value="owner">Dono</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant={user.is_banned ? "outline" : "destructive"}
        size="sm"
        onClick={() => handleBanUser(user.id, !user.is_banned)}
        disabled={actionLoading === user.id}
        className={user.is_banned ? "border-neon-green text-neon-green hover:bg-neon-green/10" : ""}
      >
        {actionLoading === user.id ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : user.is_banned ? (
          <>
            <Check className="w-4 h-4 mr-1" /> Desbanir
          </>
        ) : (
          <>
            <Ban className="w-4 h-4 mr-1" /> Banir
          </>
        )}
      </Button>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <header className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-neon-green" />
        <h1 className="text-2xl font-bold text-foreground">Painel Admin</h1>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card/80 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-neon-cyan" />
              <span className="text-2xl font-bold text-foreground">{stats.users}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-neon-orange" />
              <span className="text-2xl font-bold text-foreground">{stats.posts}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Banidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-neon-red" />
              <span className="text-2xl font-bold text-foreground">{stats.banned}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-secondary">
          <TabsTrigger value="users" className="data-[state=active]:bg-neon-cyan/20 data-[state=active]:text-neon-cyan">
            Usuários Recentes
          </TabsTrigger>
          <TabsTrigger
            value="search"
            className="data-[state=active]:bg-neon-cyan/20 data-[state=active]:text-neon-cyan"
          >
            Buscar Usuário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-3 mt-4">
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </TabsContent>

        <TabsContent value="search" className="space-y-4 mt-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por nome ou UID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="bg-secondary border-border"
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-neon-cyan text-background hover:bg-neon-cyan/80"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </Button>
          </div>

          <div className="space-y-3">
            {searchResults.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
