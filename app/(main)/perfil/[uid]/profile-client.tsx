"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { PostCard } from "@/components/post-card"
import { VerificationBadge } from "@/components/ui/verification-badge"
import { Button } from "@/components/ui/button"
import type { User } from "@/lib/auth"
import { UserPlus, UserCheck, MessageCircle, Settings, Clock } from "lucide-react"

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

interface ProfileClientProps {
  profileUser: User
  posts: Post[]
  currentUser: User
  friendshipStatus: "pending" | "accepted" | "rejected" | null
  friendshipRequesterId: string | null
  friendsCount: number
  postsCount: number
}

export function ProfileClient({
  profileUser,
  posts: initialPosts,
  currentUser,
  friendshipStatus: initialStatus,
  friendshipRequesterId,
  friendsCount: initialFriendsCount,
  postsCount: initialPostsCount,
}: ProfileClientProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [friendshipStatus, setFriendshipStatus] = useState(initialStatus)
  const [isLoading, setIsLoading] = useState(false)
  const [ffData, setFfData] = useState({
    level: profileUser.ff_level,
    likes: profileUser.ff_likes,
    guild: profileUser.ff_guild_name,
    name: profileUser.ff_name,
  })
  const [friendsCount, setFriendsCount] = useState(initialFriendsCount)
  const [postsCount, setPostsCount] = useState(initialPostsCount)
  const router = useRouter()

  const isOwnProfile = currentUser.id === profileUser.id
  const isOwner = currentUser.verification_type === "owner" || currentUser.verification_type === "pro"
  const isFriend = friendshipStatus === "accepted"
  const isPending = friendshipStatus === "pending"
  const isRequester = friendshipRequesterId === currentUser.id

  useEffect(() => {
    const updateProfile = async () => {
      try {
        const res = await fetch(`/api/users/${profileUser.ff_uid}`)
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setFfData({
              level: data.user.ff_level,
              likes: data.user.ff_likes,
              guild: data.user.ff_guild_name,
              name: data.user.ff_name,
            })
            setFriendsCount(data.friendsCount || friendsCount)
            setPostsCount(data.postsCount || postsCount)
          }
        }
      } catch (error) {
        console.error("Erro ao atualizar perfil:", error)
      }
    }

    const interval = setInterval(updateProfile, 15000)
    return () => clearInterval(interval)
  }, [profileUser.ff_uid, friendsCount, postsCount])

  const handleFriendAction = async () => {
    setIsLoading(true)
    try {
      if (isFriend) {
        await fetch(`/api/friends/${profileUser.id}`, { method: "DELETE" })
        setFriendshipStatus(null)
      } else if (isPending && !isRequester) {
        await fetch(`/api/friends/${profileUser.id}/accept`, { method: "POST" })
        setFriendshipStatus("accepted")
      } else if (isPending && isRequester) {
        await fetch(`/api/friends/${profileUser.id}`, { method: "DELETE" })
        setFriendshipStatus(null)
      } else {
        await fetch(`/api/friends/${profileUser.id}`, { method: "POST" })
        setFriendshipStatus("pending")
      }
    } catch (error) {
      console.error("Erro na ação de amizade:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartChat = async () => {
    try {
      const res = await fetch("/api/messages/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profileUser.id }),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/mensagens/${data.conversationId}`)
      }
    } catch (error) {
      console.error("Erro ao iniciar conversa:", error)
    }
  }

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
    setPostsCount((prev) => prev - 1)
  }

  const getFriendButtonContent = () => {
    if (isFriend) {
      return (
        <>
          <UserCheck className="w-4 h-4 mr-2" />
          Amigos
        </>
      )
    }
    if (isPending && !isRequester) {
      return (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          Aceitar
        </>
      )
    }
    if (isPending && isRequester) {
      return (
        <>
          <Clock className="w-4 h-4 mr-2" />
          Pendente
        </>
      )
    }
    return (
      <>
        <UserPlus className="w-4 h-4 mr-2" />
        Adicionar
      </>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Profile Header */}
      <div className="gradient-border rounded-xl bg-card/80 backdrop-blur-sm p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-orange to-neon-cyan flex items-center justify-center text-background text-3xl font-bold overflow-hidden glow-cyan">
            {profileUser.avatar_url ? (
              <Image
                src={profileUser.avatar_url || "/placeholder.svg"}
                alt={ffData.name}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              ffData.name.charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-2xl font-bold text-foreground">{profileUser.display_name || ffData.name}</h1>
              <VerificationBadge type={profileUser.verification_type} size="md" />
            </div>
            <p className="text-muted-foreground">@{ffData.name}</p>

            {profileUser.bio && <p className="mt-3 text-foreground">{profileUser.bio}</p>}

            {/* Stats */}
            <div className="flex items-center justify-center sm:justify-start gap-6 mt-4">
              <div className="text-center">
                <p className="text-xl font-bold text-neon-cyan">{ffData.level}</p>
                <p className="text-xs text-muted-foreground">Nível</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-neon-orange">{ffData.likes.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground">Likes FF</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">{postsCount}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">{friendsCount}</p>
                <p className="text-xs text-muted-foreground">Amigos</p>
              </div>
            </div>

            {ffData.guild && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-sm">
                <span className="text-muted-foreground">Guilda:</span>
                <span className="text-neon-cyan font-medium">{ffData.guild}</span>
                {profileUser.ff_guild_level && (
                  <span className="text-muted-foreground">(Nv. {profileUser.ff_guild_level})</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 justify-center sm:justify-start">
          {isOwnProfile ? (
            <Button
              onClick={() => router.push("/configuracoes")}
              variant="outline"
              className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10"
            >
              <Settings className="w-4 h-4 mr-2" />
              Editar Perfil
            </Button>
          ) : (
            <>
              <Button
                onClick={handleFriendAction}
                disabled={isLoading}
                className={
                  isFriend
                    ? "bg-neon-cyan/20 text-neon-cyan hover:bg-neon-red/20 hover:text-neon-red"
                    : isPending && !isRequester
                      ? "bg-neon-green text-background hover:bg-neon-green/80"
                      : "bg-gradient-to-r from-neon-orange to-neon-cyan text-background hover:opacity-90"
                }
              >
                {getFriendButtonContent()}
              </Button>
              {isFriend && (
                <Button
                  onClick={handleStartChat}
                  variant="outline"
                  className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 bg-transparent"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Mensagem
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Publicações</h2>
        {posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhuma publicação ainda.</div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUser.id}
              isOwner={isOwner}
              onDelete={handleDeletePost}
            />
          ))
        )}
      </div>
    </div>
  )
}
