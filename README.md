# EndlleesTube - Minecraft Video Platformu

Tamamen Türkçe, modern bir YouTube benzeri video platformu. Minecraft topluluğu için özel olarak tasarlanmış, Next.js 15 ile geliştirilmiş kapsamlı bir video paylaşım platformudur.

## 🎯 Tamamlanan Özellikler

### ✅ **Temel Özellikler**
- **🔐 Tam Türkçe Kimlik Doğrulama Sistemi**
  - Kullanıcı kaydı ve giriş (e-posta veya kullanıcı adı ile)
  - JWT tabanlı güvenli oturum yönetimi
  - Access token (15 dakika) + refresh token (7 gün)
  - Argon2 ile şifre güvenliği
  - Rol sistemi (Kullanıcı, Moderatör, Yönetici)

- **📹 Video Yönetim Sistemi**
  - Video yükleme (MP4, WebM, MOV, AVI - max 2GB)
  - Metadata yönetimi (başlık, açıklama, etiketler, görünürlük)
  - Video listeleme ve sayfalama
  - Görünürlük kontrolleri (Herkese Açık, Listelenmemiş, Özel)
  - Video yükleme progress bar

- **🎨 Modern Türkçe Arayüz**
  - Tamamen Türkçe kullanıcı deneyimi
  - Responsive tasarım (mobil uyumlu)
  - shadcn/ui component kütüphanesi
  - Modern, YouTube benzeri tasarım
  - Video kartları, hover efektleri, smooth geçişler

### 🏠 **Ana Sayfa Özellikleri**
- Trend videolar bölümü
- Arama fonksiyonu
- Video kartları (thumbnail, izlenme, beğeni, yorum sayıları)
- Video oynatıcı modal
- Yorum sistemi (görsel olarak hazır)

### 👤 **Kanalım Sayfası**
- **Kanal Profili**
  - Kanal banner ve avatar
  - Kanal istatistikleri (video sayısı, toplam izlenme, beğeni, yorum)
  - Profil düzenleme
  
- **Video Yönetimi**
  - Kullanıcının kendi videoları
  - Video yükleme (kanal üzerinden)
  - Video görünürlük rozetleri
  - Video silme ve düzenleme
  
- **İstatistikler**
  - Kanal performans kartları
  - Toplam video, izlenme, beğeni, yorum sayıları
  - Grafik alanları (gelecek için hazır)

- **Kanal Ayarları**
  - Genel ayarlar (yorumlar, öneriler)
  - Gizlilik ayarları
  - Kanal silme seçeneği

### ⚙️ **Ayarlar Sayfası**
- **Profil Ayarları**
  - Profil fotoğrafı değiştirme
  - Görünen ad, kullanıcı adı, e-posta güncelleme
  - Biyografi ekleme
  
- **Güvenlik Ayarları**
  - Şifre değiştirme
  - İki faktörlü kimlik doğrulama (2FA) hazır
  - Güvenlik logları
  
- **Bildirim Ayarları**
  - E-posta bildirimleri
  - Yorum bildirimleri
  - Beğeni bildirimleri
  - Takipçi bildirimleri
  
- **Gizlilik Ayarları**
  - Profil görünürlüğü
  - E-posta göster/gizle
  - Aktivite görünürlüğü
  - Mesaj izinleri

## 🛠️ Teknoloji Altyapısı

### Frontend
- **Next.js 15** - App Router ile
- **TypeScript** - Tam tip güvenliği
- **Tailwind CSS** - Modern stil sistemi
- **shadcn/ui** - Component kütüphanesi
- **Lucide React** - İkon seti

### Backend
- **Next.js API Routes** - RESTful API
- **Prisma ORM** - SQLite veritabanı
- **JWT** - Kimlik doğrulama
- **Argon2** - Şifre güvenliği
- **Zod** - Validasyon

### Veritabanı
- **SQLite** - Geliştirme için
- **Prisma** - Modern ORM
- Tam ilişkisel şema (users, videos, comments, views, refresh_tokens)

## 📁 Proje Yapısı

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Kimlik doğrulama endpoint'leri
│   │   └── videos/        # Video endpoint'leri
│   ├── channel/           # Kanal sayfası
│   ├── settings/          # Ayarlar sayfası
│   ├── globals.css        # Global stiller
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Ana sayfa
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility libraries
│   ├── auth.ts           # Backend auth logic
│   ├── auth-client.tsx   # Client-side auth
│   └── db.ts             # Database connection
└── prisma/               # Database schema
    └── schema.prisma     # Prisma schema
```

## 🚀 Kurulum ve Çalıştırma

### 1. **Kurulum**
```bash
git clone <repository-url>
cd endlleestube
npm install
```

### 2. **Ortam Değişkenleri**
```bash
cp .env.example .env
```

`.env` dosyasını yapılandırın:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
NODE_ENV="development"
```

### 3. **Veritabanı Kurulumu**
```bash
npm run db:push
```

### 4. **Geliştirme Sunucusunu Başlatma**
```bash
npm run dev
```

### 5. **Tarayıcıda Açın**
[http://localhost:3000](http://localhost:3000)

## 🎮 Kullanım

### **Kayıt Olma**
1. "Giriş Yap" butonuna tıklayın
2. "Kayıt" sekmesine geçin
3. Görünen ad, e-posta, kullanıcı adı ve şifre girin
4. "Hesap Oluştur" butonuna tıklayın

### **Video Yükleme**
1. Giriş yapın
2. "Yükle" butonuna tıklayın
3. Video dosyası seçin (max 2GB)
4. Başlık ve açıklama ekleyin
5. Görünürlük seçin
6. "Video Yükle" butonuna tıklayın

### **Kanal Yönetimi**
1. Kullanıcı menüsünden "Kanalım" seçeneğine tıklayın
2. Videolarınızı, istatistiklerinizi görüntüleyin
3. Profilinizi düzenleyin
4. Yeni video yükleyin

### **Ayarlar**
1. Kullanıcı menüsünden "Ayarlar" seçeneğine tıklayın
2. Profil, güvenlik, bildirim ve gizlilik ayarlarınızı yönetin

## 🔒 Güvenlik Özellikleri

- **Şifre Güvenliği**: Argon2 ile güvenli şifre saklama
- **JWT Kimlik Doğrulama**: Güvenli token tabanlı oturum yönetimi
- **Input Validasyonu**: Zod ile request validasyonu
- **Dosya Güvenliği**: Dosya tipi ve boyut validasyonu
- **CORS Koruması**: Doğru CORS yapılandırması
- **SQL Injection Koruması**: Prisma ORM koruması

## 📊 API Endpoint'leri

### Kimlik Doğrulama
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/logout` - Çıkış
- `POST /api/auth/refresh` - Token yenileme
- `GET /api/auth/me` - Mevcut kullanıcı bilgisi

### Videolar
- `GET /api/videos` - Video listeleme
- `POST /api/videos/upload` - Video yükleme
- `GET /api/videos/my-videos` - Kullanıcının videoları
- `GET /api/thumbnail/[id]` - Video thumbnail

## 🎯 Veritabanı Şeması

### Users (Kullanıcılar)
- `id`, `username`, `email`, `displayName`, `passwordHash`, `role`, `createdAt`

### Videos (Videolar)
- `id`, `userId`, `title`, `description`, `visibility`, `status`, `viewCount`, `likeCount`, `commentCount`

### Comments (Yorumlar)
- `id`, `videoId`, `userId`, `parentId`, `content`, `isHidden`, `createdAt`

### Views (İzlenmeler)
- `id`, `videoId`, `userId`, `ipHash`, `createdAt`

### Refresh Tokens
- `id`, `userId`, `tokenHash`, `expiresAt`, `createdAt`

## 🌟 Öne Çıkan Özellikler

1. **%100 Türkçe Arayüz** - Her şey Türkçe!
2. **Modern Tasarım** - YouTube benzeri, kullanıcı dostu arayüz
3. **Responsive** - Masaüstü, tablet ve mobil uyumlu
4. **Güvenli** - Modern güvenlik standartları
5. **Hızlı** - Next.js 15 ile optimize edilmiş
6. **Kapsamlı** - Kanal yönetimi, ayarlar, istatistikler
7. **Scalable** - Genişletilebilir mimari

## 📈 Gelecek Plan

### 🔄 **Yakında Eklenecekler**
- Video oynatıcı (HLS desteği ile)
- Yorum sistemi (yanıt ve moderasyon)
- Video silme ve düzenleme
- Admin paneli
- Analitik ve detaylı istatistikler
- Canlı yayın desteği
- Mobil uygulama

### 🚀 **Vizyon**
- Türkiye'nin en büyük Minecraft video platformu
- Yerli geliştirilmiş, tamamen Türkçe
- Topluluk odaklı özellikler
- Sürekli gelişim ve yenilik

## 🤝 Katkıda Bulun

1. Repository'i forklayın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi yapın (`git commit -m 'Add some amazing feature'`)
4. Branch'e push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır - [LICENSE](LICENSE) dosyasına bakın.

## 🙏 Teşekkürler

- Next.js ekibi - harika framework için
- Prisma - modern ORM için
- shadcn/ui - güzel component'lar için
- Tailwind CSS - utility-first CSS için
- Tüm Türk geliştirici topluluğu

---

**EndlleesTube** - ❤️ ile Türkiye'de geliştirildi