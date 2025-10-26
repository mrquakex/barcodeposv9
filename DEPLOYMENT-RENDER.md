# 🚀 Render.com Deploy Rehberi

## 📋 İçindekiler
1. [Hazırlık](#hazırlık)
2. [GitHub'a Yükleme](#githuba-yükleme)
3. [Render.com Kurulumu](#rendercom-kurulumu)
4. [Backend Deploy](#backend-deploy)
5. [Frontend Deploy](#frontend-deploy)
6. [Sorun Giderme](#sorun-giderme)

---

## 1️⃣ Hazırlık

### Gerekli Hesaplar
- ✅ [GitHub](https://github.com) hesabı (ücretsiz)
- ✅ [Render.com](https://render.com) hesabı (ücretsiz)

### Dosya Kontrolleri
Aşağıdaki dosyaların oluşturulduğunu kontrol edin:
- ✅ `.gitignore`
- ✅ `render.yaml`
- ✅ `backend/build.sh`

---

## 2️⃣ GitHub'a Yükleme

### Adım 1: Git Başlat
```bash
cd D:\Siteler\barcodeposv9

# Git'i başlat
git init
git add .
git commit -m "Initial commit - Barcodepos v9"
```

### Adım 2: GitHub Repository Oluştur
1. [GitHub](https://github.com) → "New Repository" tıklayın
2. Repository adı: `barcodeposv9` (veya istediğiniz ad)
3. **Public** veya **Private** seçin (ikisi de çalışır)
4. ❌ **"Add a README file" SEÇMEYİN** (zaten var)
5. "Create repository" tıklayın

### Adım 3: GitHub'a Yükle
```bash
# KULLANICI_ADIN yerine kendi GitHub kullanıcı adınızı yazın
git branch -M main
git remote add origin https://github.com/KULLANICI_ADIN/barcodeposv9.git
git push -u origin main
```

**Şifre İstenirse:**
- Kullanıcı adı: GitHub kullanıcı adınız
- Şifre: **Personal Access Token** (GitHub Settings → Developer settings → Personal access tokens → Generate new token)

---

## 3️⃣ Render.com Kurulumu

### Adım 1: Hesap Oluştur
1. [render.com](https://render.com) → "Get Started for Free"
2. **"Sign up with GitHub"** seçin (önerilen)
3. GitHub hesabınızla giriş yapın
4. Render'a GitHub erişimi verin

### Adım 2: Database Oluştur (PostgreSQL)
1. Render Dashboard → **"New +"** → **"PostgreSQL"**
2. Ayarlar:
   - **Name:** `barcodepos-db`
   - **Database:** `barcodeposv9`
   - **User:** `barcodeposv9` (otomatik)
   - **Region:** `Frankfurt (EU Central)` (Türkiye'ye en yakın)
   - **Plan:** **Free** (0.1 GB, 90 gün sonra silinir - yeterli)
3. **"Create Database"** tıklayın
4. ⏳ 2-3 dakika bekleyin (oluşturuluyor)
5. ✅ **Internal Database URL** veya **External Database URL** linkini kopyalayın
   - Örnek: `postgresql://user:pass@dpg-xxx.frankfurt-postgres.render.com/dbname`

---

## 4️⃣ Backend Deploy

### Adım 1: Backend Web Service Oluştur
1. Render Dashboard → **"New +"** → **"Web Service"**
2. **"Build and deploy from a Git repository"** → **"Next"**
3. GitHub repo'nuzu bulun: `barcodeposv9` → **"Connect"**

### Adım 2: Backend Ayarları
```
Name:               barcodepos-backend
Region:             Frankfurt (EU Central)
Branch:             main
Root Directory:     backend
Runtime:            Node
Build Command:      npm install && npx prisma generate && npx prisma migrate deploy && npm run build
Start Command:      npm start
Plan:               Free
```

### Adım 3: Environment Variables (Çevre Değişkenleri)
**"Advanced"** → **"Add Environment Variable"** tıklayın:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `DATABASE_URL` | *PostgreSQL URL'inizi yapıştırın* |
| `JWT_SECRET` | `super-secret-jwt-key-12345` (değiştirin!) |
| `ENCRYPTION_KEY` | `4fd88ca60e162379d236fb942348b5d218527702e671511d7d60a5cfc30abd97` |
| `FRONTEND_URL` | `*` (şimdilik, sonra değiştirilecek) |

### Adım 4: Deploy Başlat
1. **"Create Web Service"** tıklayın
2. ⏳ 5-10 dakika bekleyin (build + deploy)
3. ✅ Deploy başarılı olunca şu linki göreceksiniz:
   ```
   https://barcodepos-backend.onrender.com
   ```
4. **Bu URL'i kopyalayın!**

### Adım 5: Backend Test
Tarayıcıda açın:
```
https://barcodepos-backend.onrender.com/health
```

✅ Şunu görmelisiniz:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "uptime": 123.45
}
```

---

## 5️⃣ Frontend Deploy

### Adım 1: Frontend API URL'ini Güncelle

**Lokal bilgisayarınızda:**

1. `frontend/.env.production` dosyası oluşturun:
```bash
VITE_API_URL=https://barcodepos-backend.onrender.com
```

2. Git'e yükleyin:
```bash
cd D:\Siteler\barcodeposv9
git add frontend/.env.production
git commit -m "Add production API URL"
git push
```

### Adım 2: Frontend Static Site Oluştur
1. Render Dashboard → **"New +"** → **"Static Site"**
2. GitHub repo: `barcodeposv9` → **"Connect"**

### Adım 3: Frontend Ayarları
```
Name:               barcodepos-frontend
Region:             Frankfurt (EU Central)
Branch:             main
Root Directory:     frontend
Build Command:      npm install && npm run build
Publish Directory:  dist
Plan:               Free
```

### Adım 4: Environment Variables
**"Advanced"** → **"Add Environment Variable"**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://barcodepos-backend.onrender.com` |

### Adım 5: Deploy Başlat
1. **"Create Static Site"** tıklayın
2. ⏳ 3-5 dakika bekleyin
3. ✅ Deploy başarılı olunca şu linki göreceksiniz:
   ```
   https://barcodepos-frontend.onrender.com
   ```

### Adım 6: Backend CORS Güncellemesi

**Backend'e dönüp FRONTEND_URL'i güncelleyin:**

1. Render Dashboard → **Backend Service** → **"Environment"**
2. `FRONTEND_URL` değişkenini bulun
3. Değeri şuna çevirin:
   ```
   https://barcodepos-frontend.onrender.com
   ```
4. **"Save Changes"** → Backend otomatik yeniden başlar

---

## 6️⃣ Test Et! 🎉

### Frontend'i Aç
```
https://barcodepos-frontend.onrender.com
```

### Giriş Yap
Default kullanıcı:
- **Email:** `admin@barcodepos.com`
- **Şifre:** `admin123`

---

## 🔧 Sorun Giderme

### ❌ Problem: "Build Failed"

**Backend:**
```bash
# Hata loglarını kontrol et:
Render Dashboard → Backend → "Logs" sekmesi

# Sık hatalar:
- Prisma generate hatası → Build command'e "npx prisma generate" ekle
- TypeScript hatası → backend/tsconfig.json kontrol et
- Port hatası → Environment'a PORT=5000 ekle
```

**Frontend:**
```bash
# Hata loglarını kontrol et:
Render Dashboard → Frontend → "Logs" sekmesi

# Sık hatalar:
- "VITE_API_URL not found" → Environment variable ekle
- Build timeout → Free plan limiti (15 dakika)
```

### ❌ Problem: "API Connection Failed"

1. **Backend URL'i kontrol et:**
   ```
   https://barcodepos-backend.onrender.com/health
   ```
   - ❌ 404 → Backend ayakta değil
   - ✅ 200 → Backend çalışıyor

2. **Frontend VITE_API_URL kontrol et:**
   - Developer Tools (F12) → Console
   - "Failed to fetch" hatası → URL yanlış

3. **CORS hatası:**
   - Backend Environment → `FRONTEND_URL` doğru mu?

### ❌ Problem: "Database Connection Failed"

1. **DATABASE_URL kontrol et:**
   - Render Dashboard → Database → "Connections"
   - **Internal Database URL** kopyala
   - Backend Environment → `DATABASE_URL` yapıştır

2. **Prisma migrate çalışmadı mı?**
   ```bash
   # Build command'de olmalı:
   npx prisma migrate deploy
   ```

### 🐌 Problem: "Çok Yavaş!"

Render **Free Plan** özellikleri:
- ⏳ **Cold Start:** İlk istek sonrası 30-50 saniye gecikme (15 dakika aktivite yoksa uyur)
- 💾 **RAM:** 512 MB
- ⚡ **CPU:** Paylaşımlı

**Çözüm:**
- 🎯 **Paid Plan:** $7/ay → Cold start yok + daha hızlı
- 🔄 **Keep Alive:** Her 10 dakikada bir API'ye ping at (UptimeRobot.com)

---

## 📊 Render Free Plan Limitleri

| Özellik | Limit |
|---------|-------|
| **Web Services** | 750 saat/ay (31 gün x 24 saat = 744 saat) |
| **Static Sites** | Sınırsız |
| **PostgreSQL** | 1 GB, 90 gün |
| **Build Zamanı** | 15 dakika |
| **Cold Start** | 15 dakika sonra uyur |
| **Bant Genişliği** | 100 GB/ay |

---

## 🎯 Sonraki Adımlar

1. ✅ **Custom Domain** (Kendi domain'iniz):
   - Render Dashboard → Service → "Settings" → "Custom Domains"
   - Örnek: `barcodepos.com`

2. ✅ **SSL/HTTPS:**
   - Render otomatik Let's Encrypt sertifikası verir (ücretsiz)

3. ✅ **Auto-Deploy:**
   - GitHub'a her `git push` yaptığınızda otomatik deploy olur

4. ✅ **Monitoring:**
   - Render Dashboard → "Metrics" → CPU, RAM, istekler

---

## 💡 İpuçları

1. **Environment Variables'ı güvenli tut:**
   - ❌ GitHub'a `.env` dosyası yükleme
   - ✅ Render Dashboard'dan ekle

2. **Database Backup:**
   - Free plan'de otomatik backup yok
   - Manuel: Database → "Connections" → `pg_dump` komutu

3. **Logları İzle:**
   - Render Dashboard → "Logs" → Real-time log stream

4. **Maliyeti Optimize Et:**
   - Kullanmadığın servisleri "Suspend" et
   - Free plan yeterli değilse $7/ay'a geç

---

## 🆘 Yardım

**Render Dokümantasyon:**
- https://render.com/docs

**Render Community:**
- https://community.render.com

**Video Tutorial:**
- [YouTube: Deploy Node.js to Render](https://www.youtube.com/results?search_query=deploy+nodejs+render)

---

## ✅ Tamamlandı!

Artık uygulamanız **7/24 online**! 🎉

**Linkler:**
- 🌐 Frontend: `https://barcodepos-frontend.onrender.com`
- 🔌 Backend: `https://barcodepos-backend.onrender.com`
- 🗄️ Database: PostgreSQL (Render)

---

**Hazırlayan:** AI Assistant  
**Tarif:** 25 Ekim 2024  
**Versiyon:** 1.0


