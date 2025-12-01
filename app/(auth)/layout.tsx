import type React from "react"
import { Logo } from "@/components/logo"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background cyber-grid flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/5 via-transparent to-neon-orange/5 pointer-events-none" />
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="flex justify-center">
          <Logo />
        </div>
        {children}
      </div>
    </div>
  )
}
