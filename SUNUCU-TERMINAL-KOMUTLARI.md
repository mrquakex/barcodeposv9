# 🖥️ SUNUCU TERMİNALİNDE ÇALIŞTIR (Cursor Terminal'den)

Cursor'da sunucuya bağlı olduğunuz için, **Cursor'un Terminal panelinden** (alt kısımda) şu komutları çalıştırın:

## 🚀 HIZLI DEPLOY (Tek Tek Çalıştır)

### 1. Proje dizinine git
```bash
cd /home/opc/barcodeposv9
```

### 2. Git pull
```bash
git pull origin main
```

### 3. Backend'e git
```bash
cd backend
```

### 4. Prisma migration
```bash
npx prisma migrate dev --name add_mfa_fields
```

**Veya eğer hata verirse:**
```bash
npx prisma db push
```

### 5. Prisma generate
```bash
npx prisma generate
```

### 6. Ana dizine dön
```bash
cd ..
```

### 7. Docker rebuild
```bash
docker-compose build --no-cache backend
```

### 8. Docker restart
```bash
docker-compose restart backend
```

### 9. Logları kontrol et
```bash
docker-compose logs --tail=30 backend
```

---

## ✅ TEST

### Health check:
```bash
curl http://localhost:5000/health
```

### MFA endpoint (önce login token al):
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@barcodepos.com","password":"admin123"}' | jq -r '.token')

# MFA setup test
curl -X POST http://localhost:5000/api/mfa/setup \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

---

## 📝 NOTLAR

- Her komutu **sırayla** çalıştırın
- Hata olursa logları kontrol edin: `docker-compose logs backend`
- Migration hatası varsa `npx prisma db push` kullanın

**Sonra kalan 55 özelliği de eklemeye devam edeceğiz!** 🚀

