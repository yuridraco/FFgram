"use client"

import { useState, useEffect } from "react"
import { PostCard } from "@/components/post-card"
import type { User } from "@/lib/auth"

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

interface FeedClientProps {
  initialPosts: Post[]
  currentUser: User
}

export function FeedClient({ initialPosts, currentUser }: FeedClientProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)

  // Atualização automática do feed
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("/api/posts")
        if (res.ok) {
          const data = await res.json()
          setPosts(data.posts)
        }
      } catch (error) {
        console.error("Erro ao atualizar feed:", error)
      }
    }

    const interval = setInterval(fetchPosts, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  const isOwner = currentUser.verification_type === "owner" || currentUser.verification_type === "pro"

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Feed</h1>
      </header>

      {posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">Nenhuma publicação ainda.</p>
          <p className="text-muted-foreground">Seja o primeiro a postar!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUser.id}
              isOwner={isOwner}
              onDelete={handleDeletePost}
            />
          ))}
        </div>
      )}
    </div>
  )
}
