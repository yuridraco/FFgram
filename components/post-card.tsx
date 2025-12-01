"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { VerificationBadge } from "./ui/verification-badge"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Play } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"

interface PostUser {
  id: string
  ff_uid: string
  ff_name: string
  display_name?: string
  avatar_url: string | null
  verification_type: "owner" | "bot" | "verified" | "vip" | "pro" | null
}

interface Post {
  id: string
  content: string | null
  media_url: string | null
  media_type: "image" | "video" | null
  likes_count: number
  comments_count: number
  created_at: string
  user: PostUser
  is_liked?: boolean
}

interface PostCardProps {
  post: Post
  currentUserId: string
  isOwner: boolean
  onDelete?: (postId: string) => void
}

export function PostCard({ post, currentUserId, isOwner, onDelete }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.is_liked || false)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [isLiking, setIsLiking] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  const canDelete = currentUserId === post.user.id || isOwner

  const handleLike = async () => {
    if (isLiking) return
    setIsLiking(true)

    const newIsLiked = !isLiked
    setIsLiked(newIsLiked)
    setLikesCount((prev) => (newIsLiked ? prev + 1 : prev - 1))

    try {
      await fetch(`/api/posts/${post.id}/like`, {
        method: newIsLiked ? "POST" : "DELETE",
      })
    } catch {
      setIsLiked(!newIsLiked)
      setLikesCount((prev) => (newIsLiked ? prev - 1 : prev + 1))
    } finally {
      setIsLiking(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir esta publicação?")) return

    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" })
      if (res.ok && onDelete) {
        onDelete(post.id)
      }
    } catch (error) {
      console.error("Erro ao excluir post:", error)
    }
  }

  return (
    <article className="gradient-border rounded-2xl bg-card/90 backdrop-blur-sm overflow-hidden shadow-xl shadow-black/20">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link href={`/perfil/${post.user.ff_uid}`} className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-orange via-neon-red to-neon-cyan p-[2px]">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                {post.user.avatar_url ? (
                  <Image
                    src={post.user.avatar_url || "/placeholder.svg"}
                    alt={post.user.ff_name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-neon-cyan">{post.user.ff_name.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground group-hover:text-neon-cyan transition-colors">
                {post.user.display_name || post.user.ff_name}
              </span>
              <VerificationBadge type={post.user.verification_type} size="sm" />
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>
        </Link>

        {canDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-neon-red focus:text-neon-red focus:bg-neon-red/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-foreground whitespace-pre-wrap text-[15px] leading-relaxed">{post.content}</p>
        </div>
      )}

      {/* Media - Melhorado layout */}
      {post.media_url && (
        <div className="relative bg-black/40">
          {post.media_type === "video" ? (
            <div className="relative">
              <video
                src={post.media_url}
                controls
                playsInline
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                className="w-full max-h-[500px] object-contain"
                poster={`${post.media_url}#t=0.1`}
              />
              {!isVideoPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full">
              <Image
                src={post.media_url || "/placeholder.svg"}
                alt="Post media"
                width={600}
                height={600}
                className="w-full max-h-[500px] object-contain"
              />
            </div>
          )}
        </div>
      )}

      {/* Actions - Mais bonito */}
      <div className="flex items-center gap-1 p-3 border-t border-border/50">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
            isLiked ? "bg-neon-red/10 text-neon-red" : "text-muted-foreground hover:bg-secondary hover:text-neon-red",
          )}
        >
          <Heart className={cn("w-5 h-5 transition-all", isLiked && "fill-neon-red scale-110")} />
          <span className="font-medium">{likesCount}</span>
        </button>

        <Link
          href={`/post/${post.id}`}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-neon-cyan transition-all"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">{post.comments_count}</span>
        </Link>

        <button className="flex items-center gap-2 px-4 py-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-neon-orange transition-all ml-auto">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </article>
  )
}
