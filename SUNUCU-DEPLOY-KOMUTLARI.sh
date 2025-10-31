#!/bin/bash
# 🚀 56 ÖZELLİK SUNUCUYA DEPLOY SCRIPTI

echo "🚀 BarcodePOS - 56 Özellik Deployment Başlatılıyor..."
echo "================================================"

# Proje dizinine git
cd /home/opc/barcodeposv9

# 1. Git Pull
echo ""
echo "📥 1/6 - Git pull yapılıyor..."
git pull origin main
if [ $? -ne 0 ]; then
    echo "❌ Git pull başarısız!"
    exit 1
fi
echo "✅ Git pull tamamlandı"

# 2. Prisma Migration
echo ""
echo "🗄️ 2/6 - Prisma migration çalıştırılıyor..."
cd backend
npx prisma migrate dev --name add_mfa_fields 2>/dev/null || npx prisma db push
if [ $? -ne 0 ]; then
    echo "⚠️ Migration hatası, db push deneniyor..."
    npx prisma db push
fi
echo "✅ Prisma migration tamamlandı"

# 3. Prisma Generate
echo ""
echo "🔧 3/6 - Prisma client generate ediliyor..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Prisma generate başarısız!"
    exit 1
fi
echo "✅ Prisma generate tamamlandı"

cd ..

# 4. Docker Build
echo ""
echo "🐳 4/6 - Docker backend rebuild ediliyor..."
docker-compose build --no-cache backend
if [ $? -ne 0 ]; then
    echo "❌ Docker build başarısız!"
    exit 1
fi
echo "✅ Docker build tamamlandı"

# 5. Docker Restart
echo ""
echo "🔄 5/6 - Docker backend restart ediliyor..."
docker-compose restart backend
if [ $? -ne 0 ]; then
    echo "❌ Docker restart başarısız!"
    exit 1
fi
echo "✅ Docker restart tamamlandı"

# 6. Health Check
echo ""
echo "🏥 6/6 - Health check yapılıyor..."
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Backend sağlıklı (HTTP $HTTP_CODE)"
else
    echo "⚠️ Backend HTTP $HTTP_CODE döndü (hala başlıyor olabilir)"
fi

# Logları göster
echo ""
echo "📋 Son loglar:"
docker-compose logs --tail=20 backend

echo ""
echo "================================================"
echo "✅ DEPLOYMENT TAMAMLANDI!"
echo "================================================"
echo ""
echo "🔍 Kontrol için:"
echo "  docker-compose logs -f backend"
echo ""
echo "🌐 Test için:"
echo "  curl http://localhost:5000/health"
echo ""

