# 🛒 BarcodePOS v9 - Market Yönetim Sistemi

Modern, full-stack market yönetim ve barkodlu satış sistemi.

## 🚀 Özellikler

- 📦 **Stok Yönetimi** - Ürün, kategori, tedarikçi takibi
- 💰 **POS Sistemi** - Barkodlu hızlı satış
- 👥 **CRM** - Müşteri yönetimi, sadakat programı
- 📊 **Raporlama** - Gelişmiş satış ve stok raporları
- 💳 **Finans** - Gelir/gider, kasa, banka hesapları
- 🏢 **Multi-Branch** - Çok şubeli yönetim
- 🎨 **Modern UI** - Dark/Light tema, responsive tasarım
- 🔐 **Güvenlik** - JWT auth, role-based permissions

## 🛠️ Teknolojiler

### Frontend
- React 18 + TypeScript
- TailwindCSS + Shadcn/UI
- Zustand (State Management)
- Chart.js + Recharts
- Framer Motion
- Vite

### Backend
- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL / SQLite
- JWT Authentication
- WebSocket (Socket.IO)
- GraphQL (Apollo Server)

## 📦 Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn

### Lokal Geliştirme

```bash
# Repoyu klonla
git clone https://github.com/KULLANICI_ADIN/barcodeposv9.git
cd barcodeposv9

# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Frontend (yeni terminal)
cd frontend
npm install
npm run dev
```

**Uygulama:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

**Varsayılan Giriş:**
- Email: `admin@barcodepos.com`
- Şifre: `admin123`

## 🌐 Production Deploy

### Render.com ile Deploy (Önerilen)

Hızlı başlangıç için:
```bash
# 1. GitHub'a yükle
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/KULLANICI_ADIN/barcodeposv9.git
git push -u origin main

# 2. render.com → Sign up with GitHub
# 3. PostgreSQL database oluştur
# 4. Backend + Frontend web services oluştur
```

**Detaylı Rehber:** [DEPLOYMENT-RENDER.md](./DEPLOYMENT-RENDER.md)  
**Hızlı Rehber:** [QUICK-START-RENDER.md](./QUICK-START-RENDER.md)

## 📚 Dokümantasyon

- [Deployment Rehberi](./DEPLOYMENT-RENDER.md)
- [Yeni Özellikler](./YENI-OZELLIKLER-KULLANIM.md)
- [Ultra-Enterprise Özellikleri](./ULTRA-ENTERPRISE-SUMMARY.md)

## 🏗️ Proje Yapısı

```
barcodeposv9/
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── controllers/   # İş mantığı
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Auth, validation
│   │   ├── services/      # Business logic
│   │   └── server.ts      # Ana sunucu
│   ├── prisma/
│   │   └── schema.prisma  # Database şeması
│   └── package.json
│
├── frontend/              # React + TypeScript
│   ├── src/
│   │   ├── components/    # UI bileşenleri
│   │   ├── pages/         # Sayfa bileşenleri
│   │   ├── store/         # Zustand stores
│   │   ├── lib/           # Yardımcı fonksiyonlar
│   │   └── App.tsx
│   └── package.json
│
├── .gitignore
├── render.yaml            # Render.com config
└── README.md
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/register` - Yeni kullanıcı
- `GET /api/auth/me` - Kullanıcı bilgileri

### Products
- `GET /api/products` - Ürün listesi
- `POST /api/products` - Ürün oluştur
- `PUT /api/products/:id` - Ürün güncelle
- `DELETE /api/products/:id` - Ürün sil

### Sales
- `GET /api/sales` - Satış listesi
- `POST /api/sales` - Yeni satış

**Tam API Dokümantasyonu:** `/graphql` (GraphQL Playground)

## 🔐 Güvenlik

- ✅ JWT Authentication
- ✅ Bcrypt password hashing
- ✅ CORS protection
- ✅ Rate limiting
- ✅ Helmet.js security headers
- ✅ Input validation
- ✅ AES-256 encryption

## 🎯 Planlanan Özellikler

- [ ] Mobile App (React Native)
- [ ] Desktop App (Electron)
- [ ] E-Fatura entegrasyonu
- [ ] Cargo API entegrasyonu
- [ ] WhatsApp Business API
- [ ] QR kod ödemeleri
- [ ] Facial recognition kasiyerler için

## 🤝 Katkıda Bulunma

Pull request'ler kabul edilir. Büyük değişiklikler için önce issue açın.

## 📄 Lisans

MIT License - Ticari kullanıma açık

## 👨‍💻 Geliştirici

AI Assistant ile birlikte geliştirildi.

## 📞 İletişim

- GitHub Issues: [github.com/KULLANICI_ADIN/barcodeposv9/issues](https://github.com/KULLANICI_ADIN/barcodeposv9/issues)

---

**⭐ Beğendiyseniz yıldız vermeyi unutmayın!**
