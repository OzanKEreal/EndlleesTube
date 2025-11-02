# EndlleesTube - Sıkıştırılmış Versiyon

Video paylaşım platformu - Frontend ve Backend tek dosyada

## Dosyalar
- **Frontend.js** (32KB) - Tüm frontend kodu
- **Backend.js** (16KB) - Tüm backend kodu

## İçerik
### Frontend.js
- Next.js 15 + TypeScript + Tailwind CSS
- Ana sayfa component'i
- Authentication client hooks
- Layout ve global styles
- Tüm UI mantığı ve state management

### Backend.js
- Prisma database schema
- Database connection
- Authentication service (JWT + Argon2)
- API routes (videos, thumbnails)
- Server configuration

## Kurulum
1. Frontend.js ve Backend.js dosyalarını ayırın
2. Gerekli paketleri yükleyin:
   ```bash
   npm install next@15 react@19 @prisma/client jsonwebtoken argon2 zod sharp
   ```
3. Database'i kurun:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
4. Uygulamayı çalıştırın:
   ```bash
   npm run dev
   ```

## ⚠️ Önemli Not
Bu sıkıştırılmış versiyondur. Geliştirme için orijinal modüler yapıyı kullanın.

## Teknolojiler
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Prisma, SQLite, JWT, Argon2
- **Database**: SQLite
- **Authentication**: JWT + Refresh Tokens

Built with ❤️ for Minecraft content creators

