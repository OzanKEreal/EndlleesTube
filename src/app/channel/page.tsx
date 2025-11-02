'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Play, Upload, User, Eye, Heart, MessageSquare, Settings, Edit3, Calendar, Users, BarChart3, Video, Trash2, Shield, Filter } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export default function ChannelPage() {
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
      // Fetch user's videos
      const videosResponse = await fetch('/api/videos/my-videos', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      
      if (videosResponse.ok) {
        const data = await videosResponse.json()
        if (data.success) {
          setChannelVideos(data.videos)
          
          // Calculate stats
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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement profile update API
    setIsEditingProfile(false)
  }

  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const videoFile = formData.get('video') as File

    if (!videoFile || videoFile.size === 0) {
      alert('Lütfen bir video dosyası seçin')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    
    try {
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
          fetchChannelData()
          form.reset()
          setUploadProgress(0)
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 2000)
    }
  }

  const formatViewCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}B`
    return `${count}`
  }

  const VideoCard = ({ video }: { video: any }) => (
    <Card className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-200">
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
        <Badge className={`absolute top-2 left-2 text-xs ${
          video.visibility === 'PUBLIC' ? 'bg-green-600' :
          video.visibility === 'UNLISTED' ? 'bg-yellow-600' : 'bg-red-600'
        }`}>
          {video.visibility === 'PUBLIC' ? 'Herkese Açık' :
           video.visibility === 'UNLISTED' ? 'Listelenmemiş' : 'Özel'}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold line-clamp-2 text-sm mb-2">{video.title}</h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {formatViewCount(video.viewCount || 0)} izlenme
          </span>
          <span>{video.createdAt.toLocaleDateString('tr-TR')}</span>
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
          <p className="text-muted-foreground">Kanal Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Channel Header */}
      <div className="relative">
        {/* Banner */}
        <div className="h-48 bg-gradient-to-r from-red-600 to-red-800">
          <div className="absolute inset-0 bg-black/20" />
        </div>
        
        {/* Channel Info */}
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
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {new Date().toLocaleDateString('tr-TR')} katıldı
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Profili Düzenle
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Kanal Profili</DialogTitle>
                        <DialogDescription>
                          Kanal bilgilerinizi güncelleyin
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div>
                          <Label htmlFor="displayName">Kanal Adı</Label>
                          <Input
                            id="displayName"
                            value={profileData.displayName}
                            onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Kanal Açıklaması</Label>
                          <Textarea
                            id="description"
                            placeholder="Kanalınızı tanımlayın..."
                            value={profileData.description}
                            onChange={(e) => setProfileData({...profileData, description: e.target.value})}
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit">Kaydet</Button>
                          <Button type="button" variant="outline" onClick={() => setIsEditingProfile(false)}>
                            İptal
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Video Yükle
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Video Yükle</DialogTitle>
                        <DialogDescription>
                          Kanalınıza yeni video ekleyin
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
                        {isUploading && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Yükleniyor...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} />
                          </div>
                        )}
                        <Button type="submit" disabled={isUploading} className="w-full">
                          {isUploading ? 'İşleniyor...' : 'Video Yükle'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
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
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrele
                </Button>
                <Button variant="outline" size="sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Sırala
                </Button>
              </div>
            </div>
            
            {channelVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {channelVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Henüz video yüklenmemiş</h3>
                <p className="text-muted-foreground mb-4">
                  İlk videonuzu yükleyerek kanalınızı başlatın
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Upload className="w-4 h-4 mr-2" />
                      İlk Videoyu Yükle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Video Yükle</DialogTitle>
                      <DialogDescription>
                        Kanalınıza yeni video ekleyin
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
                      {isUploading && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Yükleniyor...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} />
                        </div>
                      )}
                      <Button type="submit" disabled={isUploading} className="w-full">
                        {isUploading ? 'İşleniyor...' : 'Video Yükle'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="stats" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  <div className="text-2xl font-bold">{formatViewCount(channelStats.totalLikes)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Yorum</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatViewCount(channelStats.totalComments)}</div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Performans Analizi</CardTitle>
                <CardDescription>
                  Kanalınızın performans grafiği (yakında)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <BarChart3 className="w-16 h-16" />
                  <p className="ml-4">Grafikler yakında eklenecek</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="about" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Kanal Hakkında</CardTitle>
                <CardDescription>
                  Kanalınızın detaylı bilgileri
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Kanal Adı</h3>
                  <p className="text-muted-foreground">{user.displayName}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Kullanıcı Adı</h3>
                  <p className="text-muted-foreground">@{user.username}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">E-posta</h3>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Hesap Türü</h3>
                  <Badge variant={user.role === 'ADMIN' ? 'destructive' : user.role === 'MODERATOR' ? 'default' : 'secondary'}>
                    {user.role === 'ADMIN' ? 'Yönetici' : 
                     user.role === 'MODERATOR' ? 'Moderatör' : 'Kullanıcı'}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Katılım Tarihi</h3>
                  <p className="text-muted-foreground">{new Date(user.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Kanal Ayarları</CardTitle>
                <CardDescription>
                  Kanalınızın tercihlerini yönetin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Genel Ayarlar</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Yorumlara izin ver</p>
                        <p className="text-sm text-muted-foreground">İnsanların videolarınıza yorum yapmasına izin ver</p>
                      </div>
                      <Button variant="outline" size="sm">Açık</Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Video önerileri</p>
                        <p className="text-sm text-muted-foreground">Videolarınızın önerilerde görünmesine izin ver</p>
                      </div>
                      <Button variant="outline" size="sm">Açık</Button>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-4">Gizlilik</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Kanal görünümü</p>
                        <p className="text-sm text-muted-foreground">Kanalınızın herkese açık olup olmayacağını belirleyin</p>
                      </div>
                      <Button variant="outline" size="sm">Herkese Açık</Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">İstatistikleri gizle</p>
                        <p className="text-sm text-muted-foreground">İzlenme ve beğeni sayılarını gizle</p>
                      </div>
                      <Button variant="outline" size="sm">Kapalı</Button>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-4">Tehlikeli Ayarlar</h3>
                  <div className="space-y-3">
                    <Button variant="destructive" className="w-full justify-start">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Kanalı Sil
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Bu işlem geri alınamaz. Tüm videolarınız ve kanal verileriniz kalıcı olarak silinecektir.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}