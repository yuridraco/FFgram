"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VerificationBadge } from "@/components/ui/verification-badge"
import type { User } from "@/lib/auth"
import { Camera, Loader2, Save } from "lucide-react"
import { toast } from "sonner"

export function SettingsClient({ currentUser }: { currentUser: User }) {
  const [displayName, setDisplayName] = useState(currentUser.display_name || currentUser.ff_name)
  const [bio, setBio] = useState(currentUser.bio || "")
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url)
  const [isLoading, setIsLoading] = useState(false)
  const [ffData, setFfData] = useState({
    level: currentUser.ff_level,
    likes: currentUser.ff_likes,
    guild: currentUser.ff_guild_name,
    name: currentUser.ff_name,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const syncFFData = async () => {
      try {
        const res = await fetch("/api/users/sync-ff", { method: "POST" })
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setFfData({
              level: data.user.ff_level,
              likes: data.user.ff_likes,
              guild: data.user.ff_guild_name,
              name: data.user.ff_name,
            })
          }
        }
      } catch (error) {
        console.error("Erro ao sincronizar FF:", error)
      }
    }

    // Sincronizar imediatamente
    syncFFData()

    // Sincronizar a cada 30 segundos
    const interval = setInterval(syncFFData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          avatar_url: avatarUrl,
          display_name: displayName,
        }),
      })

      if (res.ok) {
        toast.success("Perfil atualizado!")
        router.refresh()
      } else {
        throw new Error()
      }
    } catch {
      toast.error("Erro ao salvar")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview local
    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload para o servidor
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const { url } = await res.json()
        setAvatarUrl(url)
        toast.success("Foto carregada!")
      }
    } catch {
      toast.error("Erro ao carregar foto")
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
      </header>

      <Card className="bg-card/80 border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Perfil</CardTitle>
          <CardDescription>Atualize suas informações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-orange to-neon-cyan flex items-center justify-center text-background text-3xl font-bold overflow-hidden">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl || "/placeholder.svg"}
                    alt={ffData.name}
                    width={96}
                    height={96}
                    className="object-cover"
                  />
                ) : (
                  ffData.name.charAt(0).toUpperCase()
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-neon-cyan rounded-full flex items-center justify-center text-background hover:bg-neon-cyan/80 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground">{displayName || ffData.name}</span>
                <VerificationBadge type={currentUser.verification_type} size="md" />
              </div>
              <span className="text-muted-foreground">@{ffData.name}</span>
              <p className="text-xs text-muted-foreground mt-1">O @ é atualizado automaticamente pelo Free Fire</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-foreground">
              Nome de Exibição
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Como você quer ser chamado?"
              className="bg-secondary border-border focus:border-neon-cyan"
              maxLength={30}
            />
            <p className="text-xs text-muted-foreground">Este nome aparece no seu perfil. O @ não pode ser alterado.</p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-foreground">
              Bio
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Fale sobre você..."
              className="bg-secondary border-border focus:border-neon-cyan resize-none"
              rows={4}
              maxLength={200}
            />
            <span className="text-xs text-muted-foreground">{bio.length}/200</span>
          </div>

          {/* Informações do Free Fire - Atualizadas automaticamente */}
          <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Dados do Free Fire</span>
              <span className="text-xs text-neon-green flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                Atualização automática
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">UID</span>
                <p className="font-mono text-foreground">{currentUser.ff_uid}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Nível</span>
                <p className="text-foreground">{ffData.level}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Likes</span>
                <p className="text-foreground">{ffData.likes.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Guilda</span>
                <p className="text-foreground">{ffData.guild || "Sem guilda"}</p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-neon-orange to-neon-cyan text-background hover:opacity-90"
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Alterações
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
