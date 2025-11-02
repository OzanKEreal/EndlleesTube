'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Play, Pause, Volume2, VolumeX, Maximize2, SkipBack, SkipForward, Heart, MessageSquare, Share2, Download, Eye, Calendar, User, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useAuth } from '@/lib/auth-client'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Video {
  id: string
  title: string
  description: string
  thumbnailPath: string
  videoPath: string
  hlsPath: string
  duration: number
  viewCount: number
  likeCount: number
  commentCount: number
  visibility: string
  status: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    username: string
    displayName: string
  }
}

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    username: string
    displayName: string
  }
  replies?: Comment[]
}

export default function VideoPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [video, setVideo] = useState<Video | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isDisliked, setIsDisliked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentText, setCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [viewCount, setViewCount] = useState(0)

  const videoId = params.id as string

  useEffect(() => {
    fetchVideo()
    fetchComments()
  }, [videoId])

  const fetchVideo = async () => {
    try {
      const response = await fetch(`/api/videos/${videoId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setVideo(data.video)
          setLikeCount(data.video.likeCount)
          setViewCount(data.video.viewCount)
          // Increment view count
          incrementViewCount()
        }
      }
    } catch (error) {
      console.error('Failed to fetch video:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/videos/${videoId}/comments`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setComments(data.comments)
        }
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  const incrementViewCount = async () => {
    try {
      await fetch(`/api/videos/${videoId}/view`, { method: 'POST' })
    } catch (error) {
      console.error('Failed to increment view count:', error)
    }
  }

  const handleLike = async () => {
    if (!user) {
      alert('Beğenmek için giriş yapmalısınız')
      return
    }

    try {
      const response = await fetch(`/api/videos/${videoId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.liked)
        setLikeCount(data.likeCount)
      }
    } catch (error) {
      console.error('Failed to like video:', error)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      alert('Yorum yapmak için giriş yapmalısınız')
      return
    }

    if (!commentText.trim()) return

    setIsSubmittingComment(true)

    try {
      const response = await fetch(`/api/videos/${videoId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ content: commentText })
      })

      if (response.ok) {
        const data = await response.json()
        setComments([data.comment, ...comments])
        setCommentText('')
        if (video) {
          setVideo({...video, commentCount: video.commentCount + 1})
        }
      }
    } catch (error) {
      console.error('Failed to post comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatViewCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}B`
    return `${count}`
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: video?.title,
        text: video?.description,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Video linki kopyalandı!')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Play className="w-4 h-4 text-white" />
          </div>
          <p className="text-muted-foreground">Video Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Video Bulunamadı</h1>
          <p className="text-muted-foreground mb-4">Aradığınız video mevcut değil veya kaldırılmış olabilir.</p>
          <Button onClick={() => router.push('/')}>Ana Sayfaya Dön</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
              ← Ana Sayfa
            </Button>
            <h1 className="text-xl font-bold">EndlleesTube</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Input
              placeholder="Videolarda ara..."
              className="w-64"
            />
            {user ? (
              <Avatar className="w-8 h-8">
                <AvatarFallback>{user.displayName[0]}</AvatarFallback>
              </Avatar>
            ) : (
              <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                Giriş Yap
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative group">
              {/* Video Placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <Play className="w-20 h-20 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">Video Oynatıcı</p>
                  <p className="text-sm opacity-75">Video oynatımı burada implement edilecek</p>
                  <p className="text-xs opacity-50 mt-2">Video: {video.videoPath}</p>
                </div>
              </div>

              {/* Video Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:text-white hover:bg-white/20"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <span className="text-sm">{formatTime(currentTime)}</span>
                    <div className="w-64 bg-white/30 rounded-full h-1">
                      <div 
                        className="bg-white h-1 rounded-full transition-all"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm">{formatTime(duration || video.duration)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:text-white hover:bg-white/20"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:text-white hover:bg-white/20"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Info */}
            <div className="mt-4">
              <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    {formatViewCount(viewCount)} izlenme
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true, locale: tr })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    size="sm"
                    onClick={handleLike}
                    className="gap-2"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {likeCount}
                  </Button>
                  <Button
                    variant={isDisliked ? "default" : "outline"}
                    size="sm"
                    className="gap-2"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Channel Info */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback>{video.user.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{video.user.displayName}</h3>
                    <p className="text-sm text-muted-foreground">@{video.user.username}</p>
                  </div>
                </div>
                
                <Button variant="outline">Abone Ol</Button>
              </div>

              <Separator className="my-4" />

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Açıklama</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {video.description || 'Bu video için açıklama eklenmemiş.'}
                </p>
              </div>

              {/* Comments */}
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  Yorumlar ({video.commentCount})
                </h2>
                
                {/* Comment Form */}
                {user && (
                  <form onSubmit={handleComment} className="mb-6">
                    <div className="flex gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Yorumunuzu ekleyin..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="flex justify-end mt-2">
                          <Button
                            type="submit"
                            disabled={!commentText.trim() || isSubmittingComment}
                          >
                            {isSubmittingComment ? 'Gönderiliyor...' : 'Yorum Yap'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>{comment.user.displayName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{comment.user.displayName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: tr })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Related Videos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">İlgili Videolar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Placeholder for related videos */}
                  <div className="text-center py-8 text-muted-foreground">
                    <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">İlgili videolar yakında eklenecek</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}