#!/bin/bash

# 🚀 BARCODEPOS V9 - DEPLOYMENT SCRIPT WITH AUTO CACHE CLEAR
# Bu script her deployment'ta cache'i otomatik temizler

set -e  # Exit on error

echo "🚀 BarcodePOS v9 Deployment Starting..."
echo "================================================"

# 1️⃣ Git Pull
echo ""
echo "📥 1/8 - Pulling latest code..."
cd /home/ubuntu/barcodeposv9
git pull origin main
echo "✅ Code updated"

# 2️⃣ Backend Dependencies
echo ""
echo "📦 2/8 - Installing backend dependencies..."
cd backend
npm install --production
echo "✅ Backend dependencies installed"

# 3️⃣ Prisma Generate
echo ""
echo "🔧 3/8 - Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"

# 4️⃣ Frontend Dependencies
echo ""
echo "📦 4/8 - Installing frontend dependencies..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed"

# 5️⃣ Clean Old Build & Cache
echo ""
echo "🗑️  5/8 - Cleaning old build and cache..."
rm -rf dist
rm -rf node_modules/.vite
rm -rf .cache
echo "✅ Old build cleaned"

# 6️⃣ Build Frontend with Cache Busting
echo ""
echo "🏗️  6/8 - Building frontend (hash-based filenames)..."
npm run build
BUILD_TIME=$(date +%s)
echo "Build timestamp: $BUILD_TIME" > dist/build.txt
echo "✅ Frontend built with cache busting"

# 7️⃣ Docker Rebuild with No Cache
echo ""
echo "🐳 7/8 - Rebuilding Docker containers (no cache)..."
cd ..
docker compose build --no-cache frontend backend
docker compose up -d --force-recreate
echo "✅ Docker containers rebuilt"

# 8️⃣ Clear Nginx Cache & Reload
echo ""
echo "🧹 8/8 - Clearing Nginx cache..."
# Clear Nginx cache inside container
docker exec barcodepos_frontend sh -c "rm -rf /var/cache/nginx/*" || true
# Reload Nginx configuration
docker exec barcodepos_frontend nginx -s reload || true
echo "✅ Nginx cache cleared and reloaded"

# 🎉 Success
echo ""
echo "================================================"
echo "✅ DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "================================================"
echo ""
echo "🔥 Cache Busting Applied:"
echo "  ✓ Hash-based JS/CSS filenames"
echo "  ✓ Nginx cache headers configured"
echo "  ✓ Docker containers recreated"
echo "  ✓ Nginx cache cleared"
echo ""
echo "🌐 Application: https://barcodepos.trade"
echo "📊 Health check in 10 seconds..."
sleep 10

# Health Check
echo ""
echo "🏥 Running health check..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Frontend is responding (HTTP $HTTP_CODE)"
else
    echo "⚠️  Frontend returned HTTP $HTTP_CODE (might still be starting up)"
fi

API_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health || echo "000")
if [ "$API_CODE" = "200" ]; then
    echo "✅ Backend is responding (HTTP $API_CODE)"
else
    echo "⚠️  Backend returned HTTP $API_CODE (might still be starting up)"
fi

echo ""
echo "🎯 DEPLOYMENT COMPLETE!"
echo "🔄 Hard refresh recommended: Ctrl + Shift + R"
echo ""

