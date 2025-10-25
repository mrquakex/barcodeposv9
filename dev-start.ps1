# Development Start Script for Windows (PowerShell)
Write-Host "🚀 BarcodePOS v9 - Development Mode Başlatılıyor..." -ForegroundColor Green

# PostgreSQL kontrolü
Write-Host "`n📦 PostgreSQL başlatılıyor..." -ForegroundColor Yellow
docker-compose up -d postgres

# PostgreSQL'in hazır olmasını bekle
Write-Host "⏳ PostgreSQL'in hazır olması bekleniyor..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Backend setup
Write-Host "`n🔧 Backend kurulumu yapılıyor..." -ForegroundColor Yellow
Set-Location backend

# Node modules yoksa kur
if (-Not (Test-Path "node_modules")) {
    Write-Host "📦 Backend bağımlılıkları yükleniyor..." -ForegroundColor Cyan
    npm install
}

# Prisma setup
Write-Host "🔄 Prisma client oluşturuluyor..." -ForegroundColor Cyan
npx prisma generate

Write-Host "🔄 Veritabanı migration yapılıyor..." -ForegroundColor Cyan
npx prisma migrate dev --name init

Write-Host "🌱 Seed verileri yükleniyor..." -ForegroundColor Cyan
npm run prisma:seed

# Backend'i başlat (arka planda)
Write-Host "🚀 Backend başlatılıyor (port 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Set-Location ..

# Frontend setup
Write-Host "`n🎨 Frontend kurulumu yapılıyor..." -ForegroundColor Yellow
Set-Location frontend

# Node modules yoksa kur
if (-Not (Test-Path "node_modules")) {
    Write-Host "📦 Frontend bağımlılıkları yükleniyor..." -ForegroundColor Cyan
    npm install
}

# Frontend'i başlat
Write-Host "🚀 Frontend başlatılıyor (port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Set-Location ..

Write-Host "`n✅ Tüm servisler başlatıldı!" -ForegroundColor Green
Write-Host "`n📱 Uygulamaya erişim:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "   Database: postgresql://localhost:5432/barcodeposv9" -ForegroundColor White
Write-Host "`n👤 Demo Hesaplar:" -ForegroundColor Cyan
Write-Host "   Admin: admin@barcodepos.com / admin123" -ForegroundColor White
Write-Host "   Kasiyer: kasiyer@barcodepos.com / kasiyer123" -ForegroundColor White

