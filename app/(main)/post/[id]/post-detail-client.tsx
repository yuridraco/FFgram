"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { VerificationBadge } from "@/components/ui/verification-badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Heart, MessageCircle, Share2, ArrowLeft, Send, Trash2, Play } from "lucide-react"

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

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  user: PostUser
}

interface PostDetailClientProps {
  post: Post
  comments: Comment[]
  currentUserId: string
  currentUserAvatar: string | null
}

export function PostDetailClient({ post, comments: initialComments, currentUserId, currentUserAvatar }: PostDetailClientProps) {
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(post.is_liked || false)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [isLiking, setIsLiking] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  
  const [comments, setComments] = useState(initialComments)
  const [commentText, setCommentText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
      })

      if (res.ok) {
        const newComment = await res.json()
        setComments([...comments, newComment])
        setCommentText("")
        router.refresh()
      }
    } catch (error) {
      console.error("Erro ao enviar comentário:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Tem certeza que deseja excluir este comentário?")) return

    try {
      const res = await fetch(`/api/posts/${post.id}/comments/${commentId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setComments(comments.filter((c) => c.id !== commentId))
        router.refresh()
      }
    } catch (error) {
      console.error("Erro ao excluir comentário:", error)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Botão Voltar */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="text-muted-foreground hover:text-neon-cyan"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Voltar
      </Button>

      {/* Post */}
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
        </div>

        {/* Content */}
        {post.content && (
          <div className="px-4 pb-3">
            <p className="text-foreground whitespace-pre-wrap text-[15px] leading-relaxed">{post.content}</p>
          </div>
        )}

        {/* Media */}
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

        {/* Actions */}
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

          <div className="flex items-center gap-2 px-4 py-2 rounded-full text-muted-foreground">
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">{comments.length}</span>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-neon-orange transition-all ml-auto">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </article>

      {/* Comentários */}
      <div className="gradient-border rounded-2xl bg-card/90 backdrop-blur-sm overflow-hidden shadow-xl shadow-black/20">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-xl font-bold text-foreground">Comentários</h2>
        </div>

        {/* Lista de comentários */}
        <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
          {comments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum comentário ainda. Seja o primeiro!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="p-4 hover:bg-secondary/20 transition-colors">
                <div className="flex gap-3">
                  <Link href={`/perfil/${comment.user.ff_uid}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-orange to-neon-cyan p-[2px] flex-shrink-0">
                      <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                        {comment.user.avatar_url ? (
                          <Image
                            src={comment.user.avatar_url || "/placeholder.svg"}
                            alt={comment.user.ff_name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-neon-cyan">
                            {comment.user.ff_name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/perfil/${comment.user.ff_uid}`}
                        className="font-semibold text-foreground hover:text-neon-cyan transition-colors"
                      >
                        {comment.user.display_name || comment.user.ff_name}
                      </Link>
                      <VerificationBadge type={comment.user.verification_type} size="xs" />
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                      {comment.user_id === currentUserId && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="ml-auto text-muted-foreground hover:text-neon-red transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-foreground text-sm whitespace-pre-wrap break-words">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Formulário de novo comentário */}
        <form onSubmit={handleSubmitComment} className="p-4 border-t border-border/50">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-orange to-neon-cyan p-[2px] flex-shrink-0">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                {currentUserAvatar ? (
                  <Image
                    src={currentUserAvatar || "/placeholder.svg"}
                    alt="Você"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-neon-cyan">V</span>
                )}
              </div>
            </div>

            <div className="flex-1 flex gap-2">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escreva um comentário..."
                className="min-h-[44px] max-h-[120px] resize-none bg-secondary/50 border-border/50 focus:border-neon-cyan"
                disabled={isSubmitting}
              />
              <Button
                type="submit"
                disabled={!commentText.trim() || isSubmitting}
                className="bg-gradient-to-r from-neon-orange to-neon-cyan text-background hover:opacity-90 h-[44px]"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
