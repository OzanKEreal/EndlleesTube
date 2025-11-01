'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Play, Upload, User, Eye, Heart, MessageSquare, Search, Filter, Settings, LogOut, Home, TrendingUp, Clock, Shield, AlertCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

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
                  <Button variant="outline">Giriş Yap</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>EndlleesTube\'e Hoş Geldiniz</DialogTitle>
                    <DialogDescription>
                      Minecraft video topluluğuna katılın
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs value={isRegistering ? "register" : "login"} onValueChange={(value) => setIsRegistering(value === "register")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login">Giriş</TabsTrigger>
                      <TabsTrigger value="register">Kayıt</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login" className="space-y-4">
                      <form onSubmit={handleLogin} className="space-y-3">
                        <div>
                          <Label htmlFor="login-identifier">E-posta veya Kullanıcı Adı</Label>
                          <Input
                            id="login-identifier"
                            name="identifier"
                            placeholder="E-posta veya kullanıcı adı girin"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="login-password">Şifre</Label>
                          <Input
                            id="login-password"
                            name="password"
                            type="password"
                            placeholder="Şifrenizi girin"
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
                    <TabsContent value="register" className="space-y-4">
                      <form onSubmit={handleRegister} className="space-y-3">
                        <div>
                          <Label htmlFor="register-displayName">Görünen Ad</Label>
                          <Input
                            id="register-displayName"
                            name="displayName"
                            placeholder="Görünen adınız"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="register-email">E-posta</Label>
                          <Input
                            id="register-email"
                            name="email"
                            type="email"
                            placeholder="eposta@ornek.com"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="register-username">Kullanıcı Adı</Label>
                          <Input
                            id="register-username"
                            name="username"
                            placeholder="kullaniciadi"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="register-password">Şifre</Label>
                          <Input
                            id="register-password"
                            name="password"
                            type="password"
                            placeholder="Şifre oluşturun"
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

      {/* Navigation */}
      <nav className="border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6 py-3">
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="w-4 h-4" />
              Ana Sayfa
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Trendler
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Clock className="w-4 h-4" />
              Son Eklenenler
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtreler
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Trend Minecraft Videoları</h2>
          <p className="text-muted-foreground">Topluluğumuzdan en iyi Minecraft içeriklerini keşfedin</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </main>

      {/* Video Player Dialog */}
      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
            <DialogDescription>
              {selectedVideo?.user?.displayName} tarafından
            </DialogDescription>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">Video Oynatıcı</p>
                  <p className="text-sm opacity-75">Video oynatımı burada implement edilecek</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Heart className="w-4 h-4" />
                    {selectedVideo.likeCount}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <MessageSquare className="w-4 h-4" />
                    {selectedVideo.commentCount}
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatViewCount(selectedVideo.viewCount)} • {selectedVideo.createdAt.toLocaleDateString('tr-TR')}
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Açıklama</h3>
                <p className="text-sm text-muted-foreground">{selectedVideo.description}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Yorumlar</h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>K</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg p-3">
                        <p className="font-medium text-sm">Kullanıcı123</p>
                        <p className="text-sm">Harika video! Gerçekten içeriği çok sevdim.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>M</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg p-3">
                        <p className="font-medium text-sm">MineFan</p>
                        <p className="text-sm">Bu inşa becerilerimi çok geliştirdi!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}