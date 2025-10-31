# Control Plane Deployment Script (PowerShell)
# Sunucuya SSH ile bağlanıp deployment yapar

$SERVER_IP = "130.61.95.26"
$SERVER_USER = "opc"
$PROJECT_DIR = "/home/opc/barcodeposv9"

Write-Host "🚀 Control Plane Deployment Başlatılıyor..." -ForegroundColor Green
Write-Host ""

# Git pull
Write-Host "📥 1/8 - Git pull yapılıyor..." -ForegroundColor Yellow
ssh ${SERVER_USER}@${SERVER_IP} "cd ${PROJECT_DIR}; git pull origin main"

# Backend dependencies
Write-Host "📦 2/8 - Backend dependencies kuruluyor..." -ForegroundColor Yellow
ssh ${SERVER_USER}@${SERVER_IP} "cd ${PROJECT_DIR}/apps/corp-admin-backend; npm install"

# Frontend dependencies
Write-Host "📦 3/8 - Frontend dependencies kuruluyor..." -ForegroundColor Yellow
ssh ${SERVER_USER}@${SERVER_IP} "cd ${PROJECT_DIR}/apps/corp-admin-frontend; npm install"

# Prisma generate
Write-Host "🗄️ 4/8 - Prisma client generate ediliyor..." -ForegroundColor Yellow
ssh ${SERVER_USER}@${SERVER_IP} "cd ${PROJECT_DIR}/apps/corp-admin-backend; npx prisma generate"

# Docker rebuild
Write-Host "🐳 5/8 - Docker containers rebuild ediliyor..." -ForegroundColor Yellow
ssh ${SERVER_USER}@${SERVER_IP} "cd ${PROJECT_DIR}; docker-compose build --no-cache corp-admin-backend corp-admin-frontend"

# Containers restart
Write-Host "🔄 6/8 - Containers restart ediliyor..." -ForegroundColor Yellow
ssh ${SERVER_USER}@${SERVER_IP} "cd ${PROJECT_DIR}; docker-compose up -d corp-admin-backend corp-admin-frontend"

# Logları göster
Write-Host "📋 7/8 - Son loglar kontrol ediliyor..." -ForegroundColor Yellow
ssh ${SERVER_USER}@${SERVER_IP} "cd ${PROJECT_DIR}; docker-compose logs --tail=30 corp-admin-backend"
ssh ${SERVER_USER}@${SERVER_IP} "cd ${PROJECT_DIR}; docker-compose logs --tail=30 corp-admin-frontend"

Write-Host ""
Write-Host "✅ Deployment tamamlandı!" -ForegroundColor Green
Write-Host "🌐 Admin Panel: https://admin.barcodepos.trade" -ForegroundColor Cyan

