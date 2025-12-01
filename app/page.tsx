import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { Flame, Users, MessageCircle, Shield } from "lucide-react"

export default async function HomePage() {
  const session = await getSession()

  if (session) {
    redirect("/feed")
  }

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/5 via-transparent to-neon-orange/5 pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Logo />
          <div className="flex gap-3">
            <Button asChild variant="ghost" className="text-foreground hover:text-neon-cyan">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-neon-orange to-neon-cyan text-background hover:opacity-90">
              <Link href="/cadastro">Criar Conta</Link>
            </Button>
          </div>
        </header>

        {/* Hero */}
        <main className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight text-balance">
              A Rede Social dos <span className="text-neon-orange glow-text-orange">Jogadores</span> de Free Fire
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Conecte-se com outros jogadores brasileiros, compartilhe suas conquistas, forme esquadrões e domine as
              partidas juntos!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-neon-orange to-neon-cyan text-background hover:opacity-90 glow-orange text-lg px-8"
              >
                <Link href="/cadastro">
                  <Flame className="w-5 h-5 mr-2" />
                  Começar Agora
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 text-lg px-8 bg-transparent"
              >
                <Link href="/login">Já tenho conta</Link>
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-24 max-w-5xl mx-auto">
            <div className="gradient-border rounded-xl p-6 bg-card/50 backdrop-blur-sm text-center space-y-4">
              <div className="w-14 h-14 bg-neon-cyan/10 rounded-xl flex items-center justify-center mx-auto">
                <Users className="w-7 h-7 text-neon-cyan" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Conecte-se</h3>
              <p className="text-muted-foreground">
                Adicione amigos, forme esquadrões e encontre novos parceiros de jogo
              </p>
            </div>

            <div className="gradient-border rounded-xl p-6 bg-card/50 backdrop-blur-sm text-center space-y-4">
              <div className="w-14 h-14 bg-neon-orange/10 rounded-xl flex items-center justify-center mx-auto">
                <MessageCircle className="w-7 h-7 text-neon-orange" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Converse</h3>
              <p className="text-muted-foreground">
                Chat privado e grupos para organizar estratégias e zoar com a galera
              </p>
            </div>

            <div className="gradient-border rounded-xl p-6 bg-card/50 backdrop-blur-sm text-center space-y-4">
              <div className="w-14 h-14 bg-neon-green/10 rounded-xl flex items-center justify-center mx-auto">
                <Shield className="w-7 h-7 text-neon-green" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Compartilhe</h3>
              <p className="text-muted-foreground">Poste suas melhores jogadas, conquistas e momentos épicos</p>
            </div>
          </div>
        </main>

        {/* Footer - Alterado para FFgram */}
        <footer className="container mx-auto px-4 py-8 mt-20 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo />
            <p className="text-sm text-muted-foreground">FFgram - A maior rede social de Free Fire do Brasil</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
