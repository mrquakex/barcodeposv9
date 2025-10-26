#!/bin/bash

# Development Start Script for Linux/Mac
echo "🚀 BarcodePOS v9 - Development Mode Başlatılıyor..."

# PostgreSQL kontrolü
echo ""
echo "📦 PostgreSQL başlatılıyor..."
docker-compose up -d postgres

# PostgreSQL'in hazır olmasını bekle
echo "⏳ PostgreSQL'in hazır olması bekleniyor..."
sleep 5

# Backend setup
echo ""
echo "🔧 Backend kurulumu yapılıyor..."
cd backend

# Node modules yoksa kur
if [ ! -d "node_modules" ]; then
    echo "📦 Backend bağımlılıkları yükleniyor..."
    npm install
fi

# Prisma setup
echo "🔄 Prisma client oluşturuluyor..."
npx prisma generate

echo "🔄 Veritabanı migration yapılıyor..."
npx prisma migrate dev --name init

echo "🌱 Seed verileri yükleniyor..."
npm run prisma:seed

# Backend'i başlat (arka planda)
echo "🚀 Backend başlatılıyor (port 5000)..."
npm run dev &
BACKEND_PID=$!

cd ..

# Frontend setup
echo ""
echo "🎨 Frontend kurulumu yapılıyor..."
cd frontend

# Node modules yoksa kur
if [ ! -d "node_modules" ]; then
    echo "📦 Frontend bağımlılıkları yükleniyor..."
    npm install
fi

# Frontend'i başlat
echo "🚀 Frontend başlatılıyor (port 5173)..."
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "✅ Tüm servisler başlatıldı!"
echo ""
echo "📱 Uygulamaya erişim:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5000"
echo "   Database: postgresql://localhost:5432/barcodeposv9"
echo ""
echo "👤 Demo Hesaplar:"
echo "   Admin: admin@barcodepos.com / admin123"
echo "   Kasiyer: kasiyer@barcodepos.com / kasiyer123"
echo ""
echo "⚠️  Durdurmak için Ctrl+C'ye basın"

# Trap SIGINT and SIGTERM
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; docker-compose stop postgres; exit" INT TERM

# Wait for background processes
wait


