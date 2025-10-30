# 🚀 BarcodePOS v9 - Deployment Guide

## 📋 İçindekiler
1. [Otomatik Deployment](#otomatik-deployment)
2. [Manuel Deployment](#manuel-deployment)
3. [Cache Temizleme Stratejisi](#cache-temizleme-stratejisi)
4. [Troubleshooting](#troubleshooting)

---

## 🤖 Otomatik Deployment

### Kullanım

```bash
# Sunucuya SSH ile bağlan
ssh oracle-vm

# Deployment script'i çalıştır
cd /home/ubuntu/barcodeposv9
chmod +x deploy.sh
./deploy.sh
```

### Script Ne Yapar?

1. ✅ **Git Pull** - En son kodu çeker
2. ✅ **Backend Install** - npm dependencies
3. ✅ **Prisma Generate** - Database client
4. ✅ **Frontend Install** - npm dependencies
5. ✅ **Cache Clear** - Eski build ve cache temizliği
6. ✅ **Build** - Hash-based filenames ile build
7. ✅ **Docker Rebuild** - No-cache ile rebuild
8. ✅ **Nginx Cache Clear** - Server-side cache temizleme
9. ✅ **Health Check** - Deployment doğrulama

**Toplam Süre:** ~3-5 dakika

---

## 🔧 Manuel Deployment

### 1. Code Update
```bash
cd /home/ubuntu/barcodeposv9
git pull origin main
```

### 2. Backend
```bash
cd backend
npm install --production
npx prisma generate
npx prisma migrate deploy  # Sadece DB değişikliği varsa
```

### 3. Frontend
```bash
cd ../frontend
npm install
rm -rf dist node_modules/.vite  # Cache temizle
npm run build
```

### 4. Docker
```bash
cd ..
docker compose build --no-cache frontend backend
docker compose up -d --force-recreate
```

### 5. Nginx Cache Clear
```bash
docker exec barcodepos_frontend sh -c "rm -rf /var/cache/nginx/*"
docker exec barcodepos_frontend nginx -s reload
```

---

## 🔥 Cache Temizleme Stratejisi

BarcodePOS v9, **4 seviyeli cache temizleme** kullanır:

### 1️⃣ Build-Time Cache Busting

**Dosya:** `frontend/vite.config.ts`

```typescript
rollupOptions: {
  output: {
    entryFileNames: `assets/[name]-[hash].js`,
    chunkFileNames: `assets/[name]-[hash].js`,
    assetFileNames: `assets/[name]-[hash].[ext]`,
  }
}
```

**Nasıl Çalışır:**
- Her build'de dosya içeriğine göre unique hash oluşturur
- `main.js` → `main-a1b2c3d4.js`
- Dosya değişirse hash değişir → Browser otomatik yeni dosyayı indirir

### 2️⃣ Server-Side Cache Headers

**Dosya:** `frontend/nginx.conf`

```nginx
# index.html - ASLA cache'leme
location = /index.html {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}

# JS/CSS/Assets - Long cache (hash sayesinde güvenli)
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**Nasıl Çalışır:**
- `index.html` her zaman sunucudan kontrol edilir
- Hash'li static dosyalar 1 yıl cache'lenir (değişmeyecekleri için güvenli)

### 3️⃣ HTML Meta Tags

**Dosya:** `frontend/index.html`

```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

**Nasıl Çalışır:**
- Browser'a "bu HTML'i cache'leme" talimatı verir
- Backup yöntem (bazı eski browser'lar için)

### 4️⃣ Deployment-Time Cache Clear

**Dosya:** `deploy.sh`

```bash
# Frontend cache temizle
rm -rf dist node_modules/.vite .cache

# Nginx cache temizle
docker exec barcodepos_frontend sh -c "rm -rf /var/cache/nginx/*"
docker exec barcodepos_frontend nginx -s reload

# Docker rebuild (no cache)
docker compose build --no-cache
docker compose up -d --force-recreate
```

**Nasıl Çalışır:**
- Build öncesi tüm local cache temizlenir
- Docker container'lar sıfırdan oluşturulur
- Nginx cache fiziksel olarak silinir

---

## 🌐 Client-Side Cache Clear

Kullanıcılara deployment sonrası yapmaları gerekenler:

### Chrome / Edge
```
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)
```

### Firefox
```
Ctrl + F5         (Windows/Linux)
Cmd + Shift + R   (Mac)
```

### Safari
```
Cmd + Option + R  (Mac)
```

### Tamamen Temizleme
```
1. DevTools aç (F12)
2. Network tab
3. "Disable cache" işaretle
4. Sayfayı yenile
```

---

## 🔍 Troubleshooting

### ❌ Modal'lar açılmıyor / Eski kod yükleniyor

**Çözüm 1: Server cache temizle**
```bash
ssh oracle-vm
cd /home/ubuntu/barcodeposv9
docker exec barcodepos_frontend sh -c "rm -rf /var/cache/nginx/*"
docker exec barcodepos_frontend nginx -s reload
docker compose restart frontend
```

**Çözüm 2: Full redeploy**
```bash
./deploy.sh
```

**Çözüm 3: Browser hard refresh**
```
Ctrl + Shift + R
```

### ❌ CSS değişiklikleri görünmüyor

**Neden:** Browser CSS dosyasını cache'lemiş

**Çözüm:**
```bash
# 1. Yeni build yap
cd /home/ubuntu/barcodeposv9/frontend
rm -rf dist
npm run build

# 2. Docker rebuild
cd ..
docker compose up -d --no-deps --build frontend

# 3. Browser'da hard refresh
Ctrl + Shift + R
```

### ❌ API değişiklikleri çalışmıyor

**Neden:** Backend container'ı güncel değil

**Çözüm:**
```bash
cd /home/ubuntu/barcodeposv9

# Backend rebuild
docker compose build --no-cache backend
docker compose up -d --force-recreate backend

# Log'ları kontrol et
docker compose logs -f backend
```

### ❌ "Hash mismatch" hatası

**Neden:** Build sırasında hash hesaplaması yanlış gitmiş

**Çözüm:**
```bash
cd /home/ubuntu/barcodeposv9/frontend

# Tamamen temizle
rm -rf dist node_modules/.vite node_modules/.cache

# Yeniden build
npm run build

# Docker rebuild
cd ..
docker compose up -d --no-deps --build frontend
```

---

## 📊 Cache Verification

Deployment sonrası cache'in temizlendiğini doğrula:

### 1. DevTools Network Tab
```
1. F12 → Network
2. "Disable cache" KAPALI olmalı
3. Sayfayı yenile
4. index.html → Response Headers kontrol et:
   ✅ Cache-Control: no-cache, no-store, must-revalidate
   
5. main-[hash].js → Response Headers:
   ✅ Cache-Control: public, max-age=31536000, immutable
```

### 2. Build Hash Kontrol
```bash
# Local'de
cd frontend/dist
ls -la assets/

# Sunucuda
ssh oracle-vm
docker exec barcodepos_frontend ls -la /usr/share/nginx/html/assets/

# Her deployment'ta hash'ler değişmeli:
# main-a1b2c3.js → main-d4e5f6.js
```

### 3. Nginx Headers Test
```bash
curl -I https://barcodepos.trade/

# Görmelisin:
# Cache-Control: no-cache, no-store, must-revalidate
# Pragma: no-cache
# Expires: 0
```

---

## 🎯 Best Practices

### ✅ DO
- ✅ Her deployment için `deploy.sh` kullan
- ✅ Deployment sonrası hard refresh yap
- ✅ Modal/form sorunlarında önce cache temizle
- ✅ Kritik değişiklikler için Docker rebuild yap

### ❌ DON'T
- ❌ Production'da `docker compose up -d` (cache kullanır)
- ❌ `npm run build` sonrası Docker rebuild yapmadan test etme
- ❌ Nginx cache'i temizlemeden "bug var" deme
- ❌ Browser cache'i disable etmeden test yapma

---

## 📞 Support

Hala sorun mu var?

1. **Sunucu log'ları:**
   ```bash
   docker compose logs -f frontend
   docker compose logs -f backend
   ```

2. **Browser console:**
   ```
   F12 → Console → Hataları kontrol et
   ```

3. **Full system restart:**
   ```bash
   ./deploy.sh
   # Sonra browser'da: Ctrl + Shift + R
   ```

---

**Son Güncelleme:** 2025-10-30  
**Versiyon:** 9.0.0  
**Deployment Süresi:** ~3-5 dakika

