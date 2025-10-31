# 🚀 HEMEN DEPLOY ET

## Yerel Makinede (Şu an buradasın):

### 1. Git Push Yap (✅ Tamamlandı)
```bash
git add .
git commit -m "feat: Complete all 56 enterprise features"
git push
```

## Sunucuda (SSH ile bağlan):

### 2. Sunucuya SSH ile Bağlan

**Windows PowerShell'de:**
```powershell
ssh opc@130.61.95.26
```

**Veya PuTTY/WinSCP kullanıyorsan:**
- Host: `130.61.95.26`
- User: `opc`
- Port: `22`

### 3. Sunucuda Deployment Komutlarını Çalıştır

Sunucuya bağlandıktan sonra aşağıdaki komutları sırayla çalıştır:

```bash
# Proje dizinine git
cd /home/opc/barcodeposv9

# Git pull (son değişiklikleri çek)
git pull origin main

# Backend dependencies kur
cd apps/corp-admin-backend
npm install
cd ../..

# Frontend dependencies kur
cd apps/corp-admin-frontend
npm install
cd ../..

# Prisma client generate et
cd apps/corp-admin-backend
npx prisma generate
cd ../..

# Docker containers rebuild et
docker-compose build --no-cache corp-admin-backend corp-admin-frontend

# Containers restart et
docker-compose up -d corp-admin-backend corp-admin-frontend

# Logları kontrol et
docker-compose logs --tail=50 corp-admin-backend
docker-compose logs --tail=50 corp-admin-frontend
```

### 4. Tek Satırda Çalıştır (Copy-Paste için):

Sunucuya bağlandıktan sonra şu komutu çalıştır:

```bash
cd /home/opc/barcodeposv9 && git pull origin main && cd apps/corp-admin-backend && npm install && cd ../corp-admin-frontend && npm install && cd ../../apps/corp-admin-backend && npx prisma generate && cd ../../ && docker-compose build --no-cache corp-admin-backend corp-admin-frontend && docker-compose up -d corp-admin-backend corp-admin-frontend && docker-compose logs --tail=30 corp-admin-backend
```

## 🔍 Kontrol Et

1. **Backend Logları:**
   ```bash
   docker-compose logs -f corp-admin-backend
   ```
   - Hata var mı kontrol et
   - "Server running on port 4001" mesajını görüyor musun?

2. **Frontend Logları:**
   ```bash
   docker-compose logs -f corp-admin-frontend
   ```
   - Build başarılı mı kontrol et

3. **Browser'da Test Et:**
   - https://admin.barcodepos.trade
   - Login sayfası açılıyor mu?
   - Yeni sayfalar görünüyor mu?

## ⚠️ Sorun Çıkarsa

### Backend Başlamıyorsa:
```bash
# Prisma generate tekrar dene
cd /home/opc/barcodeposv9/apps/corp-admin-backend
npx prisma generate
cd ../..
docker-compose restart corp-admin-backend
```

### Frontend Build Hatası:
```bash
# Dependencies tekrar kur
cd /home/opc/barcodeposv9/apps/corp-admin-frontend
npm install
cd ../..
docker-compose build --no-cache corp-admin-frontend
docker-compose up -d corp-admin-frontend
```

### Container Logları:
```bash
# Tüm logları gör
docker-compose logs corp-admin-backend | tail -100
docker-compose logs corp-admin-frontend | tail -100
```

## ✅ Deployment Başarılı!

Eğer her şey tamamlandıysa:
- ✅ Git pull yapıldı
- ✅ Dependencies kuruldu
- ✅ Prisma generate edildi
- ✅ Docker containers rebuild edildi
- ✅ Containers restart edildi
- ✅ Loglar temiz görünüyor
- ✅ https://admin.barcodepos.trade açılıyor

**Tebrikler! 🎉**

