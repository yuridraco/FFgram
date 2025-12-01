import type React from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { Sidebar } from "@/components/sidebar"
import { MobileNav } from "@/components/mobile-nav"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/5 via-transparent to-neon-orange/5 pointer-events-none" />
      <div className="relative z-10 flex">
        <Sidebar user={session} />
        <main className="flex-1 min-h-screen pb-20 md:pb-0 md:ml-64">{children}</main>
      </div>
      <MobileNav user={session} />
    </div>
  )
}
