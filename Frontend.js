// ========================================
// ENDLLEESTUBE - FRONTEND.JS
// Tüm Frontend Kodları Tek Dosyada
// ========================================

'use client'

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Play, Upload, User, Eye, Heart, MessageSquare, Search, Filter, Settings, LogOut, Home, 
  TrendingUp, Clock, Shield, AlertCircle, Edit3, Calendar, Users, BarChart3, Video, 
  Trash2, Pause, Volume2, VolumeX, Maximize2, SkipBack, SkipForward, Share2, Download, 
  ThumbsUp, ThumbsDown, Bell, Lock, Palette, Globe, HelpCircle, CheckCircle, AlertTriangle 
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

// ========================================
// AUTH CONTEXT & PROVIDER
// ========================================

interface User {
  id: string
  username: string
  email: string
  displayName: string
  role: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
}

interface RegisterData {
  displayName: string
  email: string
  username: string
  password: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        localStorage.removeItem('accessToken')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (identifier: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.user)
        localStorage.setItem('accessToken', data.accessToken)
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        setUser(result.user)
        localStorage.setItem('accessToken', result.accessToken)
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      localStorage.removeItem('accessToken')
    }
  }

  const refreshToken = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('accessToken', data.accessToken)
        return true
      } else {
        await logout()
        return false
      }
    } catch (error) {
      await logout()
      return false
    }
  }

  const contextValue: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken')
  }
  return null
}

// ========================================
// MAIN PAGE COMPONENT
// ========================================

export default function EndlleesTube() {
  const { user, isLoading, login, register, logout } = useAuth()
  const router = useRouter()
  const [videos, setVideos] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  // Fetch videos from API
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch('/api/videos?limit=12')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setVideos(data.videos)
          }
        }
      } catch (error) {
        console.error('Failed to fetch videos:', error)
        // Fallback to mock data if API fails
        const mockVideos = [
          {
            id: '1',
            title: 'Minecraft Hayatta Kalma Bölüm 1 - Sıfırdan Başlıyoruz!',
            description: 'Efsanevi bir Minecraft hayatta kalma macerasına katılın. Bu ilk bölümde hiçbir şeyimiz yok ve her şeyi sıfırdan inşa ediyoruz!',
            thumbnailPath: '/api/thumbnail/1',
            viewCount: 15420,
            likeCount: 892,
            commentCount: 127,
            duration: '12:34',
            createdAt: new Date('2024-01-15'),
            user: {
              displayName: 'CraftMaster',
              avatar: '/api/placeholder/40/40'
            },
            visibility: 'PUBLIC',
            status: 'READY'
          },
          {
            id: '2',
            title: 'Minecraft\'ta Modern Ev Yapımı',
            description: 'Temiz çizgilere ve harika iç tasarıma sahip güzel bir modern ev nasıl inşa edilir öğrenin.',
            thumbnailPath: '/api/thumbnail/2',
            viewCount: 8934,
            likeCount: 567,
            commentCount: 89,
            duration: '18:45',
            createdAt: new Date('2024-01-14'),
            user: {
              displayName: 'BuilderPro',
              avatar: '/api/placeholder/40/40'
            },
            visibility: 'PUBLIC',
            status: 'READY'
          },
          {
            id: '3',
            title: 'Minecraft PvP İpuçları ve Hileleri',
            description: 'Minecraft\'ta PvP sanatını bu gelişmiş teknikler ve stratejilerle ustalaşın.',
            thumbnailPath: '/api/thumbnail/3',
            viewCount: 23156,
            likeCount: 1203,
            commentCount: 234,
            duration: '15:20',
            createdAt: new Date('2024-01-13'),
            user: {
              displayName: 'PvPLegend',
              avatar: '/api/placeholder/40/40'
            },
            visibility: 'PUBLIC',
            status: 'READY'
          }
        ]
        setVideos(mockVideos)
      }
    }

    fetchVideos()
  }, [])

  const formatViewCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M izlenme`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}B izlenme`
    return `${count} izlenme`
  }

  const handleVideoUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) {
      setAuthError('Lütfen video yüklemek için giriş yapın')
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)
    const videoFile = formData.get('video') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const visibility = formData.get('visibility') as string

    console.log('Upload data:', { videoFile, title, description, visibility })

    if (!videoFile || videoFile.size === 0) {
      setAuthError('Lütfen bir video dosyası seçin')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setAuthError('')
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/videos/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Refresh videos list
          const videosResponse = await fetch('/api/videos?limit=12')
          if (videosResponse.ok) {
            const videosData = await videosResponse.json()
            if (videosData.success) {
              setVideos(videosData.videos)
            }
          }
          setIsVideoDialogOpen(false)
          setUploadProgress(0)
          // Reset form
          form.reset()
        } else {
          setAuthError(data.error || 'Yükleme başarısız')
        }
      } else {
        const errorData = await response.json()
        setAuthError(errorData.error || 'Yükleme başarısız')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setAuthError('Yükleme başarısız. Lütfen tekrar deneyin.')
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 2000)
    }
  }

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthError('')
    
    const formData = new FormData(event.currentTarget)
    const identifier = formData.get('identifier') as string
    const password = formData.get('password') as string
    
    const result = await login(identifier, password)
    if (!result.success) {
      setAuthError(result.error || 'Giriş başarısız')
    }
  }

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthError('')
    
    const formData = new FormData(event.currentTarget)
    const data = {
      displayName: formData.get('displayName') as string,
      email: formData.get('email') as string,
      username: formData.get('username') as string,
      password: formData.get('password') as string
    }
    
    const result = await register(data)
    if (!result.success) {
      setAuthError(result.error || 'Kayıt başarısız')
    }
  }

  const VideoCard = ({ video }: { video: any }) => (
    <Card className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-200" onClick={() => {
      setSelectedVideo(video)
      setIsVideoDialogOpen(true)
    }}>
      <div className="relative aspect-video bg-muted">
        <img 
          src={video.thumbnailPath || '/api/placeholder/320/180'} 
          alt={video.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-xs">
          {video.duration || '0:00'}
        </Badge>
      </div>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="w-9 h-9 mt-1">
            <AvatarImage src={video.user?.avatar} />
            <AvatarFallback>{video.user?.displayName?.[0] || 'K'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold line-clamp-2 text-sm mb-1">{video.title}</h3>
            <p className="text-xs text-muted-foreground mb-2">{video.user?.displayName || 'Bilinmeyen'}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {formatViewCount(video.viewCount || 0)}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {video.likeCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {video.commentCount || 0}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Play className="w-4 h-4 text-white" />
          </div>
          <p className="text-muted-foreground">EndlleesTube Yükleniyor...</p>
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
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold">EndlleesTube</h1>
            </div>
            <Badge variant="secondary" className="text-xs">Beta</Badge>
          </div>

          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Videolarda ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Yükle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Video Yükle</DialogTitle>
                      <DialogDescription>
                        Minecraft anılarınızı toplulukla paylaşın
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleVideoUpload} className="space-y-4">
                      <div>
                        <Label htmlFor="video">Video Dosyası</Label>
                        <Input
                          id="video"
                          name="video"
                          type="file"
                          accept="video/*"
                          required
                          disabled={isUploading}
                        />
                      </div>
                      <div>
                        <Label htmlFor="title">Başlık</Label>
                        <Input
                          id="title"
                          name="title"
                          placeholder="Video başlığını girin..."
                          required
                          disabled={isUploading}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Açıklama</Label>
                        <Textarea
                          id="description"
                          name="description"
                          placeholder="Videonuzu tanımlayın..."
                          rows={3}
                          disabled={isUploading}
                        />
                      </div>
                      <div>
                        <Label htmlFor="visibility">Görünürlük</Label>
                        <Select name="visibility" defaultValue="PUBLIC" disabled={isUploading}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PUBLIC">Herkese Açık</SelectItem>
                            <SelectItem value="UNLISTED">Listelenmemiş</SelectItem>
                            <SelectItem value="PRIVATE">Özel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {isUploading && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Yükleniyor...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} />
                        </div>
                      )}
                      {authError && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                          <AlertCircle className="w-4 h-4" />
                          {authError}
                        </div>
                      )}
                      <Button type="submit" disabled={isUploading} className="w-full">
                        {isUploading ? 'İşleniyor...' : 'Video Yükle'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                      </Avatar>
                      {user.displayName}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push('/channel')}>
                      <User className="w-4 h-4 mr-2" />
                      Kanalım
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/settings')}>
                      <Settings className="w-4 h-4 mr-2" />
                      Ayarlar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Çıkış Yap
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Giriş Yap</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>EndlleesTube'a Hoş Geldiniz!</DialogTitle>
                    <DialogDescription>
                      Minecraft videolarınızı paylaşmaya başlayın
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs value={isRegistering ? "register" : "login"} onValueChange={(value) => setIsRegistering(value === "register")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login">Giriş</TabsTrigger>
                      <TabsTrigger value="register">Kayıt</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                          <Label htmlFor="identifier">E-posta veya Kullanıcı Adı</Label>
                          <Input
                            id="identifier"
                            name="identifier"
                            type="text"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="password">Şifre</Label>
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                          />
                        </div>
                        {authError && (
                          <div className="flex items-center gap-2 text-sm text-destructive">
                            <AlertCircle className="w-4 h-4" />
                            {authError}
                          </div>
                        )}
                        <Button type="submit" className="w-full">Giriş Yap</Button>
                      </form>
                    </TabsContent>
                    <TabsContent value="register">
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                          <Label htmlFor="displayName">Görünen Ad</Label>
                          <Input
                            id="displayName"
                            name="displayName"
                            type="text"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">E-posta</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="username">Kullanıcı Adı</Label>
                          <Input
                            id="username"
                            name="username"
                            type="text"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="password">Şifre</Label>
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                          />
                        </div>
                        {authError && (
                          <div className="flex items-center gap-2 text-sm text-destructive">
                            <AlertCircle className="w-4 h-4" />
                            {authError}
                          </div>
                        )}
                        <Button type="submit" className="w-full">Hesap Oluştur</Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Trending Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold">Trend Videolar</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Kategoriler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: 'Hayatta Kalma', icon: '🏕️', color: 'bg-green-500' },
              { name: 'Yapı', icon: '🏗️', color: 'bg-blue-500' },
              { name: 'PvP', icon: '⚔️', color: 'bg-red-500' },
              { name: 'Redstone', icon: '🔴', color: 'bg-red-600' },
              { name: 'Macera', icon: '🗺️', color: 'bg-purple-500' },
              { name: 'Komik', icon: '😄', color: 'bg-yellow-500' }
            ].map((category) => (
              <Card key={category.name} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center mx-auto mb-2 text-2xl`}>
                    {category.icon}
                  </div>
                  <p className="font-medium text-sm">{category.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Video Player Dialog */}
      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
            <DialogDescription>
              {selectedVideo?.user?.displayName} • {formatViewCount(selectedVideo?.viewCount || 0)} izlenme
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold">Video Oynatıcı</p>
              <p className="text-sm opacity-75">Video oynatımı burada implement edilecek</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-muted-foreground">
              {selectedVideo?.description || 'Bu video için açıklama eklenmemiş.'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ========================================
// CHANNEL PAGE COMPONENT
// ========================================

export function ChannelPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [channelVideos, setChannelVideos] = useState<any[]>([])
  const [channelStats, setChannelStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0
  })
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    displayName: '',
    description: '',
    bannerUrl: ''
  })
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
      return
    }

    if (user) {
      setProfileData({
        displayName: user.displayName,
        description: '',
        bannerUrl: ''
      })
      fetchChannelData()
    }
  }, [user, isLoading, router])

  const fetchChannelData = async () => {
    try {
      const videosResponse = await fetch('/api/videos/my-videos', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      
      if (videosResponse.ok) {
        const data = await videosResponse.json()
        if (data.success) {
          setChannelVideos(data.videos)
          
          const stats = data.videos.reduce((acc: any, video: any) => {
            acc.totalVideos++
            acc.totalViews += video.viewCount || 0
            acc.totalLikes += video.likeCount || 0
            acc.totalComments += video.commentCount || 0
            return acc
          }, { totalVideos: 0, totalViews: 0, totalLikes: 0, totalComments: 0 })
          
          setChannelStats(stats)
        }
      }
    } catch (error) {
      console.error('Failed to fetch channel data:', error)
    }
  }

  const formatViewCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}B`
    return `${count}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Play className="w-4 h-4 text-white" />
          </div>
          <p className="text-muted-foreground">Kanal Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Channel Header */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-red-600 to-red-800">
          <div className="absolute inset-0 bg-black/20" />
        </div>
        
        <div className="container mx-auto px-4 -mt-16 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 mb-8">
            <Avatar className="w-32 h-32 border-4 border-background">
              <AvatarFallback className="text-3xl">
                {user.displayName[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{user.displayName}</h1>
                  <p className="text-muted-foreground mb-4">@{user.username}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      {channelStats.totalVideos} video
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {formatViewCount(channelStats.totalViews)} toplam izlenme
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="videos">Videolar</TabsTrigger>
            <TabsTrigger value="stats">İstatistikler</TabsTrigger>
            <TabsTrigger value="about">Hakkında</TabsTrigger>
            <TabsTrigger value="settings">Ayarlar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="videos" className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Videolarım</h2>
            </div>
            
            {channelVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {channelVideos.map((video) => (
                  <Card key={video.id} className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-200">
                    <div className="relative aspect-video bg-muted">
                      <img 
                        src={video.thumbnailPath || '/api/placeholder/320/180'} 
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-xs">
                        {video.duration || '0:00'}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-2 text-sm mb-2">{video.title}</h3>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatViewCount(video.viewCount || 0)} izlenme
                        </span>
                        <span>{new Date(video.createdAt).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Henüz video yüklenmemiş</h3>
                <p className="text-muted-foreground mb-4">
                  İlk videonuzu yükleyerek kanalınızı başlatın
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="stats" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Video</CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{channelStats.totalVideos}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam İzlenme</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatViewCount(channelStats.totalViews)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Beğeni</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{channelStats.totalLikes}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Yorum</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{channelStats.totalComments}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="about" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Kanal Hakkında</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Kanalınız hakkında bilgiler burada görünecek.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Kanal Ayarları</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Kanal ayarları burada görünecek.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ========================================
// SETTINGS PAGE COMPONENT
// ========================================

export function SettingsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    username: '',
    bio: ''
  })

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
      return
    }

    if (user) {
      setProfileData({
        displayName: user.displayName,
        email: user.email,
        username: user.username,
        bio: ''
      })
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <p className="text-muted-foreground">Ayarlar Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
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
            <h1 className="text-xl font-bold">Ayarlar</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback>{user.displayName[0]}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{user.displayName}</span>
          </div>
        </div>
      </header>

      {/* Settings Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ayarlar</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  <Button
                    variant={activeTab === 'profile' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('profile')}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profil
                  </Button>
                  <Button
                    variant={activeTab === 'security' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('security')}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Güvenlik
                  </Button>
                  <Button
                    variant={activeTab === 'notifications' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('notifications')}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Bildirimler
                  </Button>
                  <Button
                    variant={activeTab === 'privacy' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('privacy')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Gizlilik
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle>Profil Ayarları</CardTitle>
                  <CardDescription>
                    Hesap bilgilerinizi yönetin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-20 h-20">
                        <AvatarFallback className="text-2xl">
                          {user.displayName[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Button type="button" variant="outline" size="sm">
                          Profil Fotoğrafını Değiştir
                        </Button>
                        <p className="text-sm text-muted-foreground mt-1">
                          JPG, GIF veya PNG. Maksimum 2MB.
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="displayName">Görünen Ad</Label>
                        <Input
                          id="displayName"
                          value={profileData.displayName}
                          onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="username">Kullanıcı Adı</Label>
                        <Input
                          id="username"
                          value={profileData.username}
                          onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="email">E-posta</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="bio">Biyografi</Label>
                      <Textarea
                        id="bio"
                        placeholder="Kendinizi tanımlayın..."
                        value={profileData.bio}
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        rows={4}
                      />
                    </div>
                    
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle>Güvenlik Ayarları</CardTitle>
                  <CardDescription>
                    Hesabınızın güvenliğini yönetin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Şifre Değiştir</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                          <Input id="currentPassword" type="password" />
                        </div>
                        <div>
                          <Label htmlFor="newPassword">Yeni Şifre</Label>
                          <Input id="newPassword" type="password" />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                          <Input id="confirmPassword" type="password" />
                        </div>
                      </div>
                    </div>
                    
                    <Button>Şifreyi Değiştir</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Other tabs content would go here */}
            {activeTab !== 'profile' && activeTab !== 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">{activeTab} Ayarları</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {activeTab} ayarları burada görünecek.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ========================================
// VIDEO PAGE COMPONENT
// ========================================

export function VideoPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [video, setVideo] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentText, setCommentText] = useState('')
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
            <Input placeholder="Videolarda ara..." className="w-64" />
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
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <Play className="w-20 h-20 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">Video Oynatıcı</p>
                  <p className="text-sm opacity-75">Video oynatımı burada implement edilecek</p>
                </div>
              </div>

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
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Yorumlar</CardTitle>
              </CardHeader>
              <CardContent>
                {comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>{comment.user.displayName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{comment.user.displayName}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Henüz yorum yapılmamış.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// ========================================
// EXPORT ALL COMPONENTS
// ========================================

export {
  AuthProvider,
  useAuth,
  getAccessToken
}

// Frontend.js dosyası sonu
// Tüm frontend component'leri tek dosyada toplandı