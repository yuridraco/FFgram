import type React from "react"
import type { Metadata, Viewport } from "next"
import { Rajdhani, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FFgram - Rede Social Free Fire",
  description: "A rede social brasileira focada em Free Fire. Conecte-se, compartilhe e domine!",
  generator: "v0.app",
  keywords: ["Free Fire", "Rede Social", "Brasil", "Gaming", "FF", "FFgram"],
}

export const viewport: Viewport = {
  themeColor: "#ff6b35",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${rajdhani.className} antialiased`}>
        {children}
        <Toaster position="top-center" richColors />
        <Analytics />
      </body>
    </html>
  )
}
