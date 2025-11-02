'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Settings, Shield, Bell, Eye, Lock, Palette, Globe, HelpCircle, AlertTriangle, CheckCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
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
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    commentNotifications: true,
    likeNotifications: true,
    newFollowerNotifications: true
  })
  
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showActivity: true,
    allowMessages: true,
    allowComments: true
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

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveMessage('')
    
    try {
      // TODO: Implement profile update API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setSaveMessage('Profil başarıyla güncellendi!')
    } catch (error) {
      setSaveMessage('Profil güncellenirken hata oluştu.')
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSaveMessage('Yeni şifreler eşleşmiyor!')
      return
    }
    
    if (passwordData.newPassword.length < 8) {
      setSaveMessage('Şifre en az 8 karakter olmalıdır!')
      return
    }
    
    setIsSaving(true)
    setSaveMessage('')
    
    try {
      // TODO: Implement password change API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setSaveMessage('Şifre başarıyla değiştirildi!')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      setSaveMessage('Şifre değiştirilirken hata oluştu.')
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

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
    return null // Will redirect
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
                  <Separator className="my-2" />
                  <Button
                    variant={activeTab === 'about' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('about')}
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Hakkında
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
                  <form onSubmit={handleProfileSave} className="space-y-6">
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
                    
                    {saveMessage && (
                      <div className={`flex items-center gap-2 text-sm ${
                        saveMessage.includes('başarıyla') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {saveMessage.includes('başarıyla') ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        {saveMessage}
                      </div>
                    )}
                    
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </Button>
                  </form>
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
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Şifre Değiştir</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="newPassword">Yeni Şifre</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    {saveMessage && (
                      <div className={`flex items-center gap-2 text-sm ${
                        saveMessage.includes('başarıyla') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {saveMessage.includes('başarıyla') ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        {saveMessage}
                      </div>
                    )}
                    
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                    </Button>
                  </form>
                  
                  <Separator className="my-8" />
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">İki Faktörlü Kimlik Doğrulama</h3>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">2FA Etkin Değil</p>
                        <p className="text-sm text-muted-foreground">
                          Hesabınızı ekstra bir güvenlik katmanıyla koruyun
                        </p>
                      </div>
                      <Button variant="outline">Etkinleştir</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>Bildirim Ayarları</CardTitle>
                  <CardDescription>
                    Hangi bildirimleri almak istediğinizi seçin
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">E-posta Bildirimleri</p>
                        <p className="text-sm text-muted-foreground">
                          Önemli güncellemeler için e-posta alın
                        </p>
                      </div>
                      <Button
                        variant={notificationSettings.emailNotifications ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNotificationSettings({...notificationSettings, emailNotifications: !notificationSettings.emailNotifications})}
                      >
                        {notificationSettings.emailNotifications ? 'Açık' : 'Kapalı'}
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Yorum Bildirimleri</p>
                        <p className="text-sm text-muted-foreground">
                          Videolarınıza yorum yapıldığında bildirin
                        </p>
                      </div>
                      <Button
                        variant={notificationSettings.commentNotifications ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNotificationSettings({...notificationSettings, commentNotifications: !notificationSettings.commentNotifications})}
                      >
                        {notificationSettings.commentNotifications ? 'Açık' : 'Kapalı'}
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Beğeni Bildirimleri</p>
                        <p className="text-sm text-muted-foreground">
                          Videolarınız beğenildiğinde bildirin
                        </p>
                      </div>
                      <Button
                        variant={notificationSettings.likeNotifications ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNotificationSettings({...notificationSettings, likeNotifications: !notificationSettings.likeNotifications})}
                      >
                        {notificationSettings.likeNotifications ? 'Açık' : 'Kapalı'}
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Yeni Takipçi Bildirimleri</p>
                        <p className="text-sm text-muted-foreground">
                          Yeni takipçi kazandığınızda bildirin
                        </p>
                      </div>
                      <Button
                        variant={notificationSettings.newFollowerNotifications ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNotificationSettings({...notificationSettings, newFollowerNotifications: !notificationSettings.newFollowerNotifications})}
                      >
                        {notificationSettings.newFollowerNotifications ? 'Açık' : 'Kapalı'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <Card>
                <CardHeader>
                  <CardTitle>Gizlilik Ayarları</CardTitle>
                  <CardDescription>
                    Hesabınızın gizliliğini yönetin
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Profil Görünürlüğü</p>
                        <p className="text-sm text-muted-foreground">
                          Profilinizin kimler tarafından görünebileceğini seçin
                        </p>
                      </div>
                      <select 
                        className="px-3 py-2 border rounded-md"
                        value={privacySettings.profileVisibility}
                        onChange={(e) => setPrivacySettings({...privacySettings, profileVisibility: e.target.value})}
                      >
                        <option value="public">Herkese Açık</option>
                        <option value="friends">Sadece Arkadaşlar</option>
                        <option value="private">Özel</option>
                      </select>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">E-postayı Göster</p>
                        <p className="text-sm text-muted-foreground">
                          E-posta adresinizin profilinizde görünmesini sağlayın
                        </p>
                      </div>
                      <Button
                        variant={privacySettings.showEmail ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPrivacySettings({...privacySettings, showEmail: !privacySettings.showEmail})}
                      >
                        {privacySettings.showEmail ? 'Açık' : 'Kapalı'}
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Aktiviteyi Göster</p>
                        <p className="text-sm text-muted-foreground">
                          İzleme geçmişinizin görünmesini sağlayın
                        </p>
                      </div>
                      <Button
                        variant={privacySettings.showActivity ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPrivacySettings({...privacySettings, showActivity: !privacySettings.showActivity})}
                      >
                        {privacySettings.showActivity ? 'Açık' : 'Kapalı'}
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Mesajlara İzin Ver</p>
                        <p className="text-sm text-muted-foreground">
                          Diğer kullanıcıların size mesaj göndermesine izin verin
                        </p>
                      </div>
                      <Button
                        variant={privacySettings.allowMessages ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPrivacySettings({...privacySettings, allowMessages: !privacySettings.allowMessages})}
                      >
                        {privacySettings.allowMessages ? 'Açık' : 'Kapalı'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* About */}
            {activeTab === 'about' && (
              <Card>
                <CardHeader>
                  <CardTitle>Hakkında</CardTitle>
                  <CardDescription>
                    EndlleesTube platformu hakkında bilgi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Platform Bilgileri</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Version:</strong> 1.0.0</p>
                      <p><strong>Platform:</strong> Minecraft Video Platformu</p>
                      <p><strong>Kuruluş:</strong> 2024</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Hesap Bilgileri</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Kullanıcı ID:</strong> {user.id}</p>
                      <p><strong>Kullanıcı Adı:</strong> @{user.username}</p>
                      <p><strong>E-posta:</strong> {user.email}</p>
                      <p><strong>Hesap Türü:</strong> 
                        <Badge variant={user.role === 'ADMIN' ? 'destructive' : user.role === 'MODERATOR' ? 'default' : 'secondary'}>
                          {user.role === 'ADMIN' ? 'Yönetici' : 
                           user.role === 'MODERATOR' ? 'Moderatör' : 'Kullanıcı'}
                        </Badge>
                      </p>
                      <p><strong>Katılım Tarihi:</strong> {new Date(user.createdAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Yardım ve Destek</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <HelpCircle className="w-4 h-4 mr-2" />
                        Yardım Merkezi
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Globe className="w-4 h-4 mr-2" />
                        Topluluk Forumları
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Shield className="w-4 h-4 mr-2" />
                        Gizlilik Politikası
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}