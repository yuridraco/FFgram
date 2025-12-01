"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { User } from "@/lib/auth"
import { Users, Plus, Check, X, MessageSquare } from "lucide-react"
import { toast } from "sonner"

interface Group {
  id: string
  name: string
  avatar_url: string | null
  description: string | null
  owner_id: string
}

interface GroupInvite extends Group {
  owner?: { ff_name: string }
}

interface GroupsClientProps {
  currentUser: User
  initialGroups: Group[]
  initialInvites: GroupInvite[]
}

export function GroupsClient({ currentUser, initialGroups, initialInvites }: GroupsClientProps) {
  const [groups, setGroups] = useState(initialGroups)
  const [invites, setInvites] = useState(initialInvites)

  const handleAcceptInvite = async (inviteId: string, group: Group) => {
    try {
      const res = await fetch(`/api/groups/${inviteId}/accept`, { method: "POST" })
      if (res.ok) {
        setGroups((prev) => [...prev, group])
        setInvites((prev) => prev.filter((i) => i.id !== inviteId))
        toast.success("Convite aceito!")
      }
    } catch {
      toast.error("Erro ao aceitar convite")
    }
  }

  const handleRejectInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/groups/${inviteId}/reject`, { method: "POST" })
      if (res.ok) {
        setInvites((prev) => prev.filter((i) => i.id !== inviteId))
        toast.success("Convite recusado")
      }
    } catch {
      toast.error("Erro ao recusar convite")
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Grupos</h1>
        <Button asChild className="bg-gradient-to-r from-neon-orange to-neon-cyan text-background">
          <Link href="/grupos/criar">
            <Plus className="w-4 h-4 mr-2" />
            Criar Grupo
          </Link>
        </Button>
      </header>

      <Tabs defaultValue="groups" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-secondary">
          <TabsTrigger
            value="groups"
            className="data-[state=active]:bg-neon-cyan/20 data-[state=active]:text-neon-cyan"
          >
            Meus Grupos ({groups.length})
          </TabsTrigger>
          <TabsTrigger
            value="invites"
            className="data-[state=active]:bg-neon-orange/20 data-[state=active]:text-neon-orange"
          >
            Convites ({invites.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-3 mt-4">
          {groups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Você não está em nenhum grupo.</p>
              <Link href="/grupos/criar" className="text-neon-cyan hover:underline">
                Criar um grupo
              </Link>
            </div>
          ) : (
            groups.map((group) => (
              <Link
                key={group.id}
                href={`/grupos/${group.id}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-card/80 border border-border hover:border-neon-cyan/50 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-orange to-neon-cyan flex items-center justify-center text-background font-bold overflow-hidden">
                  {group.avatar_url ? (
                    <Image
                      src={group.avatar_url || "/placeholder.svg"}
                      alt={group.name}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <MessageSquare className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-foreground truncate block">{group.name}</span>
                  {group.description && (
                    <span className="text-sm text-muted-foreground truncate block">{group.description}</span>
                  )}
                </div>
              </Link>
            ))
          )}
        </TabsContent>

        <TabsContent value="invites" className="space-y-3 mt-4">
          {invites.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum convite pendente.</p>
            </div>
          ) : (
            invites.map((invite) => (
              <div key={invite.id} className="flex items-center gap-4 p-4 rounded-xl bg-card/80 border border-border">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-orange to-neon-cyan flex items-center justify-center text-background font-bold overflow-hidden">
                  {invite.avatar_url ? (
                    <Image
                      src={invite.avatar_url || "/placeholder.svg"}
                      alt={invite.name}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <MessageSquare className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-foreground truncate block">{invite.name}</span>
                  <span className="text-sm text-muted-foreground">
                    Convite de {invite.owner?.ff_name || "desconhecido"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    className="bg-neon-green hover:bg-neon-green/80 text-background"
                    onClick={() => handleAcceptInvite(invite.id, invite)}
                  >
                    <Check className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-neon-red hover:bg-neon-red/10"
                    onClick={() => handleRejectInvite(invite.id)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
