# 🚀 AWS DEPLOYMENT REHBERI

## 📋 ÖN HAZIRLIK

### Gerekli Araçlar:
1. AWS Account (zaten var ✅)
2. AWS CLI kurulu olmalı
3. EB CLI (Elastic Beanstalk CLI)

### AWS CLI Kurulumu:
```bash
# Windows için:
# https://awscli.amazonaws.com/AWSCLIV2.msi indir ve kur

# Kurulum sonrası:
aws --version
```

### EB CLI Kurulumu:
```bash
pip install awsebcli --upgrade --user
eb --version
```

---

## 1️⃣ DATABASE (RDS PostgreSQL)

### AWS Console'da:
1. **RDS** servisine git
2. **Create Database** tıkla
3. **Ayarlar:**
   - Engine: PostgreSQL
   - Version: 15.x
   - Template: **Free tier** ✅
   - DB instance: `db.t3.micro` (ücretsiz)
   - Master username: `postgres`
   - Master password: `[güçlü-şifre-belirle]`
   - DB name: `barcodepos`
   - **Public access: YES** (geçici, güvenlik ayarlarını sonra yapacağız)
   - VPC security group: **Create new**
   - Initial database name: `barcodepos`

4. **Create Database** tıkla (5-10 dakika sürer)

### Database URL'i al:
```
Endpoint: xxxx.rds.amazonaws.com
Port: 5432

DATABASE_URL formatı:
postgresql://postgres:SIFRAN@xxxx.rds.amazonaws.com:5432/barcodepos
```

### Security Group Ayarı:
1. RDS → Databases → [database-adın] → VPC security groups
2. Inbound rules → Edit
3. **Add rule:**
   - Type: PostgreSQL
   - Port: 5432
   - Source: **0.0.0.0/0** (geçici, sonra Elastic Beanstalk'ın IP'sini ekleyeceğiz)

---

## 2️⃣ BACKEND DEPLOYMENT (Elastic Beanstalk)

### Hazırlık (Local):
```bash
cd backend

# AWS credentials ayarla
aws configure
# AWS Access Key ID: [konsol'dan al]
# AWS Secret Access Key: [konsol'dan al]
# Region: eu-central-1 (Frankfurt)
# Output format: json

# EB başlat
eb init

# Sorular:
# - Select a default region: 8 (eu-central-1)
# - Application name: barcodepos-backend
# - Platform: Node.js
# - Platform version: (en son)
# - SSH keypair: (istersen oluştur, n de diyebilirsin)
```

### Environment variables ayarla:
```bash
# .env.production dosyası oluştur (bu sadece notun için, AWS'ye manuel gireceğiz)
DATABASE_URL=postgresql://postgres:SIFRA@xxxx.rds.amazonaws.com:5432/barcodepos
JWT_SECRET=super-gizli-jwt-secret-buraya
PORT=8080
NODE_ENV=production
```

### Elastic Beanstalk ortamı oluştur:
```bash
eb create barcodepos-backend-prod

# Sorular:
# - Environment name: barcodepos-backend-prod
# - DNS CNAME prefix: barcodepos-backend (benzersiz olmalı)
# - Load balancer: application

# Bu 10-15 dakika sürebilir ☕
```

### Environment variables'ı AWS'ye ekle:
```bash
# AWS Console'da:
# Elastic Beanstalk → Environments → barcodepos-backend-prod
# Configuration → Software → Edit
# Environment properties ekle:

DATABASE_URL=postgresql://postgres:SIFRA@xxxx.rds.amazonaws.com:5432/barcodepos
JWT_SECRET=super-gizli-jwt-secret
PORT=8080
NODE_ENV=production

# Apply tıkla
```

### Deploy:
```bash
eb deploy

# Backend URL:
# https://barcodepos-backend.eu-central-1.elasticbeanstalk.com
```

### Health check:
```bash
eb open
# Tarayıcıda açılacak, /health endpoint'ini kontrol et
```

---

## 3️⃣ FRONTEND DEPLOYMENT (AWS Amplify)

### AWS Console'da:
1. **AWS Amplify** servisine git
2. **New app** → **Host web app**
3. **GitHub** seç → Authorize
4. **Repository:** `barcodeposv9`
5. **Branch:** `main`
6. **App name:** `barcodepos-frontend`
7. **Monorepo:** `frontend` klasörünü seç
8. **Build settings:**

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

9. **Environment variables ekle:**
```
VITE_API_URL=https://barcodepos-backend.eu-central-1.elasticbeanstalk.com
```

10. **Save and deploy**

### Frontend URL:
```
https://main.xxxxxxxxx.amplifyapp.com
```

---

## 4️⃣ CORS VE API AYARLARI

### Backend'de CORS güncelle:
`backend/src/server.ts`:
```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://main.xxxxxxxxx.amplifyapp.com', // Amplify URL'in
  ],
  credentials: true,
}));
```

### Frontend'de API URL güncelle:
`frontend/.env.production`:
```
VITE_API_URL=https://barcodepos-backend.eu-central-1.elasticbeanstalk.com
```

### Deploy:
```bash
# Backend
cd backend
eb deploy

# Frontend (otomatik - git push yeterli)
git add -A
git commit -m "Update AWS production URLs"
git push origin main
```

---

## 5️⃣ DATABASE MIGRATION

### Prisma migrate (Backend'den):
```bash
# Local'den RDS'e migrate
cd backend
DATABASE_URL="postgresql://postgres:SIFRA@xxxx.rds.amazonaws.com:5432/barcodepos" npx prisma migrate deploy

# Seed (ilk data)
DATABASE_URL="postgresql://postgres:SIFRA@xxxx.rds.amazonaws.com:5432/barcodepos" npm run prisma:seed
```

---

## 6️⃣ CUSTOM DOMAIN (Opsiyonel)

### Backend için:
1. Route 53'te domain'i ekle
2. Elastic Beanstalk → Environment → Custom domain
3. SSL Certificate (AWS Certificate Manager'dan ücretsiz)

### Frontend için:
1. Amplify → Domain management
2. Add domain
3. DNS kayıtlarını güncelle

---

## 💰 MALIYET TAHMINI (Aylık)

**Free Tier ile (İlk 12 ay):**
- RDS db.t3.micro: **ÜCRETSİZ** (750 saat/ay)
- Elastic Beanstalk: **ÜCRETSİZ** (EC2 için ödeme yaparsın)
- EC2 t3.micro: **ÜCRETSİZ** (750 saat/ay)
- Amplify: **İlk 1000 build dakikası ÜCRETSİZ**
- RDS Storage: 20GB **ÜCRETSİZ**

**Toplam:** ~$0-5/ay (data transfer için minimal)

**Free Tier bitince:**
- RDS: ~$15/ay
- EC2: ~$8/ay
- Amplify: ~$10/ay
- **Toplam: ~$33/ay**

---

## 🔐 GÜVENLĠK AYARLARI (SONRA YAP)

### RDS Security:
1. Public access: NO
2. VPC içinden bağlan
3. Security group: Sadece Elastic Beanstalk'tan erişim

### Elastic Beanstalk:
1. HTTPS zorla
2. Environment variables encryption
3. Auto-scaling ayarları

### Amplify:
1. Branch protection
2. Custom headers (security)
3. Access control

---

## 📊 MONITORING

### CloudWatch:
- Otomatik log toplama
- CPU, Memory, Request metrics
- Alarmlar kurabilirsin

### Elastic Beanstalk Health:
- Real-time health monitoring
- Email notifications

---

## 🚀 DEPLOYMENT FLOW (Sonrası)

### Backend güncellemesi:
```bash
cd backend
git pull origin main
eb deploy
```

### Frontend güncellemesi:
```bash
git push origin main
# Amplify otomatik deploy eder ✅
```

---

## ⚡ HIZLI BAŞLANGIÇ KOMUTLARI

```bash
# 1. AWS CLI kur
# https://awscli.amazonaws.com/AWSCLIV2.msi

# 2. EB CLI kur
pip install awsebcli

# 3. AWS credentials
aws configure

# 4. RDS oluştur (Console'dan)
# → xxxx.rds.amazonaws.com URL'ini al

# 5. Backend deploy
cd backend
eb init
eb create barcodepos-backend-prod
# Environment variables ekle (Console'dan)
eb deploy

# 6. Frontend deploy
# Amplify Console'dan GitHub bağla
# Build settings ayarla
# Deploy

# 7. Database migrate
DATABASE_URL="..." npx prisma migrate deploy
DATABASE_URL="..." npm run prisma:seed

# ✅ HAZIR!
```

---

## 🆘 SORUN GĠDERME

### Backend çalışmıyor:
```bash
eb logs
eb ssh  # SSH ile servera bağlan
```

### Database bağlanamıyor:
- Security group kontrol et
- RDS public access açık mı?
- DATABASE_URL doğru mu?

### Frontend API'ye bağlanamıyor:
- CORS ayarları kontrol et
- VITE_API_URL doğru mu?
- Backend health check çalışıyor mu?

---

## 📞 YARDIM

### AWS Support:
- Free tier: Email support yok
- Developer plan: $29/ay (7/24 email support)

### Community:
- AWS Forums
- Stack Overflow
- AWS Discord

---

## ✅ CHECKLIST

- [ ] AWS CLI kuruldu
- [ ] EB CLI kuruldu
- [ ] RDS database oluşturuldu
- [ ] Backend Elastic Beanstalk'a deploy edildi
- [ ] Frontend Amplify'a deploy edildi
- [ ] Environment variables ayarlandı
- [ ] CORS ayarları yapıldı
- [ ] Database migrate edildi
- [ ] Health check çalışıyor
- [ ] Test edildi ✅

---

**🎉 AWS'de hazırsın! Render'dan çok daha güçlü ve ölçeklenebilir!**

