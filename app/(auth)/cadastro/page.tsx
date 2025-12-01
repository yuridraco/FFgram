"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, UserPlus, CheckCircle2, XCircle } from "lucide-react"

interface FFInfo {
  name: string
  level: number
  likes: number
  guild: string | null
}

export default function CadastroPage() {
  const [uid, setUid] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [ffInfo, setFfInfo] = useState<FFInfo | null>(null)
  const [uidVerified, setUidVerified] = useState(false)
  const router = useRouter()

  const verifyUid = useCallback(async (uidToVerify: string) => {
    if (!uidToVerify.trim() || uidToVerify.length < 6) {
      return
    }

    setIsVerifying(true)
    setError("")
    setFfInfo(null)
    setUidVerified(false)

    try {
      const response = await fetch(`/api/verify-uid?uid=${uidToVerify}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "UID não encontrado")
      }

      setFfInfo(data)
      setUidVerified(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao verificar UID")
      setUidVerified(false)
    } finally {
      setIsVerifying(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (uid.length >= 6 && !uidVerified && !isVerifying) {
        verifyUid(uid)
      }
    }, 800) // Aguarda 800ms após parar de digitar

    return () => clearTimeout(timer)
  }, [uid, uidVerified, isVerifying, verifyUid])

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!uidVerified) {
      setError("Aguarde a verificação do UID")
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      return
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar conta")
      }

      router.push("/feed")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="gradient-border bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          <UserPlus className="w-6 h-6 text-neon-cyan" />
          Criar Conta
        </CardTitle>
        <CardDescription className="text-muted-foreground">Crie sua conta com seu UID do Free Fire</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCadastro} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="uid" className="text-foreground">
              UID do Free Fire
            </Label>
            <div className="relative">
              <Input
                id="uid"
                type="text"
                placeholder="Ex: 130098219"
                value={uid}
                onChange={(e) => {
                  setUid(e.target.value.replace(/\D/g, ""))
                  setUidVerified(false)
                  setFfInfo(null)
                }}
                required
                className="bg-secondary border-border focus:border-neon-cyan pr-10"
              />
              {isVerifying && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-5 h-5 animate-spin text-neon-cyan" />
                </div>
              )}
              {uidVerified && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle2 className="w-5 h-5 text-neon-green" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">A verificação será feita automaticamente</p>
          </div>

          {ffInfo && uidVerified && (
            <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-neon-green">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Conta verificada!</span>
              </div>
              <div className="text-sm text-foreground space-y-1">
                <p>
                  <span className="text-muted-foreground">Nome:</span> {ffInfo.name}
                </p>
                <p>
                  <span className="text-muted-foreground">Nível:</span> {ffInfo.level}
                </p>
                <p>
                  <span className="text-muted-foreground">Likes:</span> {ffInfo.likes.toLocaleString("pt-BR")}
                </p>
                {ffInfo.guild && (
                  <p>
                    <span className="text-muted-foreground">Guilda:</span> {ffInfo.guild}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Seu @ será: <span className="text-neon-cyan">@{ffInfo.name}</span>
              </p>
            </div>
          )}

          {!uidVerified && uid.length >= 6 && !isVerifying && error && (
            <div className="bg-neon-red/10 border border-neon-red/30 rounded-lg p-3 flex items-center gap-2 text-neon-red">
              <XCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={!uidVerified}
              className="bg-secondary border-border focus:border-neon-cyan disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground">
              Confirmar Senha
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repita a senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={!uidVerified}
              className="bg-secondary border-border focus:border-neon-cyan disabled:opacity-50"
            />
          </div>

          {error && !uid && <p className="text-sm text-neon-red bg-neon-red/10 p-2 rounded-lg">{error}</p>}

          <Button
            type="submit"
            disabled={isLoading || !uidVerified}
            className="w-full bg-gradient-to-r from-neon-cyan to-neon-orange hover:opacity-90 text-background font-semibold disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando conta...
              </>
            ) : (
              "Criar Conta"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/login" className="text-neon-cyan hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
