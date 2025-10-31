# Sunucuya Deployment Komutları

## 🚀 Hızlı Deployment

Sunucuya bağlanıp aşağıdaki komutları sırayla çalıştırın:

### 1. Git Pull (Yerel)
```bash
git add .
git commit -m "feat: Complete all enterprise features"
git push
```

### 2. Sunucuya Bağlan ve Deploy Et

**SSH ile bağlan:**
```bash
ssh opc@130.61.95.26
```

**Sunucuda çalıştır:**
```bash
cd /home/opc/barcodeposv9

# Git pull
git pull origin main

# Backend dependencies
cd apps/corp-admin-backend
npm install
cd ../..

# Frontend dependencies  
cd apps/corp-admin-frontend
npm install
cd ../..

# Prisma generate
cd apps/corp-admin-backend
npx prisma generate
cd ../..

# Docker rebuild ve restart
docker-compose build --no-cache corp-admin-backend corp-admin-frontend
docker-compose up -d corp-admin-backend corp-admin-frontend

# Logları kontrol et
docker-compose logs --tail=50 corp-admin-backend
docker-compose logs --tail=50 corp-admin-frontend
```

### 3. Tek Komutla Deployment (PowerShell)

PowerShell'de çalıştırın:

```powershell
ssh opc@130.61.95.26 "cd /home/opc/barcodeposv9 && git pull origin main && cd apps/corp-admin-backend && npm install && cd ../corp-admin-frontend && npm install && cd ../../apps/corp-admin-backend && npx prisma generate && cd ../../ && docker-compose build --no-cache corp-admin-backend corp-admin-frontend && docker-compose up -d corp-admin-backend corp-admin-frontend && docker-compose logs --tail=30 corp-admin-backend"
```

## ⚠️ Önemli Notlar

1. **İlk defa deploy ediyorsanız:**
   - Database migration çalıştırın: `npx prisma migrate deploy`
   - Admin kullanıcı oluşturun: `npm run seed:admin`

2. **Yeni paketler eklendi:**
   - `multer` - Backend'de
   - `swagger-jsdoc` - Backend'de  
   - `swagger-ui-express` - Backend'de
   - Bu paketler `npm install` ile kurulacak

3. **Environment Variables:**
   - Backend için `ENABLE_WEBSOCKET=true` ayarlayın (docker-compose.yml veya .env)
   - Frontend için `VITE_API_URL=/api` zaten ayarlı

4. **Kontrol Listesi:**
   - [ ] Git push yapıldı mı?
   - [ ] Sunucuda git pull yapıldı mı?
   - [ ] npm install her iki proje için çalıştı mı?
   - [ ] Prisma generate çalıştı mı?
   - [ ] Docker containers rebuild edildi mi?
   - [ ] Containers restart edildi mi?
   - [ ] Loglar temiz görünüyor mu?
   - [ ] https://admin.barcodepos.trade erişilebilir mi?

## 🔍 Sorun Giderme

### Backend başlamıyorsa:
```bash
docker-compose logs corp-admin-backend
# Prisma hatası varsa:
cd apps/corp-admin-backend
npx prisma generate
cd ../..
docker-compose restart corp-admin-backend
```

### Frontend build hatası:
```bash
docker-compose logs corp-admin-frontend
# Dependencies eksikse:
cd apps/corp-admin-frontend
npm install
cd ../..
docker-compose build --no-cache corp-admin-frontend
docker-compose up -d corp-admin-frontend
```

### Port çakışması:
```bash
# Portları kontrol et
netstat -tulpn | grep 4001
netstat -tulpn | grep 3001
```

