# 🚀 BarcodePOS v9 - Kurulum Rehberi

## 📋 Gereksinimler

Sistemi çalıştırmak için aşağıdaki yazılımların kurulu olması gerekir:

1. **Node.js** (v18 veya üzeri)
   - İndir: https://nodejs.org/

2. **PostgreSQL** (v15 veya üzeri)
   - İndir: https://www.postgresql.org/download/
   - Veya Docker ile çalıştırın (önerilen)

3. **Docker Desktop** (Opsiyonel ama önerilen)
   - İndir: https://www.docker.com/products/docker-desktop/

## 🔧 Kurulum Adımları

### Seçenek 1: Docker ile Kurulum (Önerilen - En Kolay)

1. **Docker Desktop'ı indirin ve kurun**
   - Windows: https://docs.docker.com/desktop/install/windows-install/
   - Kurulum sonrası bilgisayarı yeniden başlatın

2. **Projeyi başlatın**
   ```powershell
   # PowerShell'de proje klasörüne gidin
   cd D:\Siteler\barcodeposv9
   
   # Tüm servisleri Docker ile başlatın
   docker compose up -d
   ```

3. **Tarayıcıda açın**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

### Seçenek 2: Manuel Kurulum (Development Mode)

#### 1. PostgreSQL Veritabanını Hazırlayın

**A) Docker ile (Önerilen):**
```powershell
cd D:\Siteler\barcodeposv9
docker compose up -d postgres
```

**B) Manuel PostgreSQL kurulumu:**
- PostgreSQL'i yükleyin
- `barcodeposv9` adında veritabanı oluşturun
- `backend\.env` dosyasındaki bağlantı bilgilerini güncelleyin

#### 2. Backend Kurulumu

```powershell
# Backend klasörüne gidin
cd D:\Siteler\barcodeposv9\backend

# Bağımlılıkları yükleyin
npm install

# Prisma client oluşturun
npx prisma generate

# Veritabanı migration
npx prisma migrate dev --name init

# Örnek verileri yükleyin
npm run prisma:seed

# Backend'i başlatın
npm run dev
```

Backend şimdi http://localhost:5000 adresinde çalışıyor olmalı.

#### 3. Frontend Kurulumu

Yeni bir terminal penceresi açın:

```powershell
# Frontend klasörüne gidin
cd D:\Siteler\barcodeposv9\frontend

# Bağımlılıkları yükleyin
npm install

# Frontend'i başlatın
npm run dev
```

Frontend şimdi http://localhost:5173 adresinde çalışıyor olmalı.

### Seçenek 3: Hızlı Başlatma Scripti (Windows)

```powershell
# PowerShell'de proje klasörüne gidin
cd D:\Siteler\barcodeposv9

# Otomatik kurulum ve başlatma scripti
.\dev-start.ps1
```

## 👤 Giriş Bilgileri

Sistem seed verileriyle birlikte 2 demo hesap oluşturur:

### Admin Hesabı
- **Email:** admin@barcodepos.com
- **Şifre:** admin123
- **Yetki:** Tüm yetkilere sahip

### Kasiyer Hesabı
- **Email:** kasiyer@barcodepos.com
- **Şifre:** kasiyer123
- **Yetki:** Sadece satış yapabilir

## 🔍 Sorun Giderme

### Port Çakışması
Eğer 5000 veya 5173 portları kullanılıyorsa:

**Backend için:**
- `backend\.env` dosyasında `PORT=5000` değerini değiştirin

**Frontend için:**
- `frontend\vite.config.ts` dosyasında port numarasını değiştirin

### Veritabanı Bağlantı Hatası
- PostgreSQL'in çalıştığından emin olun
- `backend\.env` dosyasındaki `DATABASE_URL` değerini kontrol edin
- Docker kullanıyorsanız: `docker ps` ile postgres container'ın çalıştığını kontrol edin

### Prisma Hatası
```powershell
cd backend
npx prisma generate
npx prisma migrate reset
npm run prisma:seed
```

### Port Kontrolü
```powershell
# Windows'ta hangi portların kullanıldığını görmek için
netstat -ano | findstr :5000
netstat -ano | findstr :5173
netstat -ano | findstr :5432
```

## 📊 Veritabanı Yönetimi

### Prisma Studio (Görsel Veritabanı Yöneticisi)
```powershell
cd backend
npx prisma studio
```
http://localhost:5555 adresinde açılır.

### Yeni Migration Oluşturma
```powershell
cd backend
npx prisma migrate dev --name migration_adi
```

### Veritabanını Sıfırlama
```powershell
cd backend
npx prisma migrate reset
npm run prisma:seed
```

## 🛠️ Geliştirme Komutları

### Backend
```powershell
npm run dev          # Development server
npm run build        # TypeScript build
npm start            # Production server
npm run prisma:seed  # Seed data yükle
```

### Frontend
```powershell
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Production preview
```

## 🐳 Docker Komutları

```powershell
# Tüm servisleri başlat
docker compose up -d

# Logları görüntüle
docker compose logs -f

# Servisleri durdur
docker compose down

# Servisleri durdur ve verileri sil
docker compose down -v

# Sadece rebuild
docker compose build

# Rebuild ve başlat
docker compose up -d --build
```

## 📦 Production Build

### Docker ile
```powershell
docker compose up -d
```

### Manuel
```powershell
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# dist klasörünü bir web sunucusuna deploy edin
```

## 🎯 Sistem Gereksinimleri

- **İşlemci:** 2 core veya üzeri
- **RAM:** 4GB minimum, 8GB önerilen
- **Disk:** 2GB boş alan
- **İşletim Sistemi:** Windows 10/11, macOS, Linux

## 📞 Destek

Sorun yaşarsanız:
1. `KURULUM.md` dosyasını tekrar okuyun
2. GitHub Issues sayfasında arama yapın
3. Yeni bir issue açın

## 🎉 Başarılı Kurulum!

Kurulum tamamlandıktan sonra:
1. http://localhost:5173 (veya 3000) adresine gidin
2. Demo hesaplardan biriyle giriş yapın
3. Sistemi keşfetmeye başlayın!


