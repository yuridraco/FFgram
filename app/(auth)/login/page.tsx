"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Flame } from "lucide-react"

export default function LoginPage() {
  const [uid, setUid] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer login")
      }

      router.push("/feed")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="gradient-border bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          <Flame className="w-6 h-6 text-neon-orange" />
          Entrar
        </CardTitle>
        <CardDescription className="text-muted-foreground">Entre com seu UID do Free Fire</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="uid" className="text-foreground">
              UID do Free Fire
            </Label>
            <Input
              id="uid"
              type="text"
              placeholder="Ex: 130098219"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              required
              className="bg-secondary border-border focus:border-neon-cyan focus:ring-neon-cyan/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-secondary border-border focus:border-neon-cyan focus:ring-neon-cyan/20"
            />
          </div>

          {error && <p className="text-sm text-neon-red bg-neon-red/10 p-2 rounded-lg">{error}</p>}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-neon-orange to-neon-cyan hover:opacity-90 text-background font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link href="/cadastro" className="text-neon-cyan hover:underline">
              Criar conta
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
