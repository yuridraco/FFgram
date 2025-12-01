"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImagePlus, Video, X, Loader2, Send } from "lucide-react"

export default function NovoPostPage() {
  const [content, setContent] = useState("")
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (file.type.startsWith("image/")) {
      setMediaType("image")
    } else if (file.type.startsWith("video/")) {
      // Check video duration (max 30 seconds)
      const video = document.createElement("video")
      video.preload = "metadata"
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        if (video.duration > 30) {
          setError("O vídeo deve ter no máximo 30 segundos")
          return
        }
        setMediaType("video")
        setMediaFile(file)
        setMediaPreview(URL.createObjectURL(file))
      }
      video.src = URL.createObjectURL(file)
      return
    } else {
      setError("Tipo de arquivo não suportado")
      return
    }

    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
    setError("")
  }

  const removeMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
    setMediaType(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!content.trim() && !mediaFile) {
      setError("Adicione um texto ou mídia para publicar")
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("content", content)
      if (mediaFile) {
        formData.append("media", mediaFile)
        formData.append("mediaType", mediaType || "")
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao criar publicação")
      }

      router.push("/feed")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar publicação")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="gradient-border bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">Nova Publicação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="O que está acontecendo no Free Fire?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="bg-secondary border-border focus:border-neon-cyan resize-none"
            />

            {mediaPreview && (
              <div className="relative rounded-xl overflow-hidden bg-secondary">
                <button
                  type="button"
                  onClick={removeMedia}
                  className="absolute top-2 right-2 z-10 p-1 rounded-full bg-background/80 text-foreground hover:bg-background"
                >
                  <X className="w-5 h-5" />
                </button>
                {mediaType === "video" ? (
                  <video src={mediaPreview} controls className="w-full max-h-96 object-contain" />
                ) : (
                  <div className="relative aspect-square">
                    <Image src={mediaPreview || "/placeholder.svg"} alt="Preview" fill className="object-contain" />
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-border hover:border-neon-cyan hover:text-neon-cyan"
                >
                  <ImagePlus className="w-5 h-5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-border hover:border-neon-orange hover:text-neon-orange"
                >
                  <Video className="w-5 h-5" />
                </Button>
              </div>

              <Button
                type="submit"
                disabled={isLoading || (!content.trim() && !mediaFile)}
                className="bg-gradient-to-r from-neon-orange to-neon-cyan text-background hover:opacity-90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Publicar
                  </>
                )}
              </Button>
            </div>

            {error && <p className="text-sm text-neon-red bg-neon-red/10 p-2 rounded-lg">{error}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
