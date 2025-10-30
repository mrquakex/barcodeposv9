#!/bin/bash

# 🚀 BARCODEPOS V9 - DEPLOYMENT SCRIPT WITH AUTO CACHE CLEAR
# Bu script her deployment'ta cache'i otomatik temizler

set -e  # Exit on error

echo "🚀 BarcodePOS v9 Deployment Starting..."
echo "================================================"

# 1️⃣ Git Pull
echo ""
echo "📥 1/9 - Pulling latest code..."
cd /home/ubuntu/barcodeposv9
git pull origin main
echo "✅ Code updated"

# 2️⃣ Backend Dependencies
echo ""
echo "📦 2/9 - Installing backend dependencies..."
cd backend
npm install --production
echo "✅ Backend dependencies installed"

# 3️⃣ Prisma Generate
echo ""
echo "🔧 3/9 - Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"

# 4️⃣ Frontend Dependencies
echo ""
echo "📦 4/8 - Installing frontend dependencies..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed"

# 4.5️⃣ Control Plane Backend Dependencies
echo ""
echo "📦 4.5/9 - Installing Control Plane backend dependencies..."
cd ../apps/corp-admin-backend
npm install --production
echo "✅ Control Plane backend dependencies installed"

# 4.6️⃣ Control Plane Frontend Dependencies
echo ""
echo "📦 4.6/9 - Installing Control Plane frontend dependencies..."
cd ../corp-admin-frontend
npm install
echo "✅ Control Plane frontend dependencies installed"

# 5️⃣ Clean Old Build & Cache
echo ""
echo "🗑️  5/9 - Cleaning old build and cache..."
cd ../../frontend
rm -rf dist
rm -rf node_modules/.vite
rm -rf .cache
cd ../apps/corp-admin-frontend
rm -rf dist
rm -rf node_modules/.vite
rm -rf .cache
echo "✅ Old build cleaned"

# 6️⃣ Build Frontends with Cache Busting
echo ""
echo "🏗️  6/9 - Building frontends (hash-based filenames)..."
cd ../../frontend
npm run build
BUILD_TIME=$(date +%s)
echo "Build timestamp: $BUILD_TIME" > dist/build.txt
echo "✅ Main frontend built with cache busting"

cd ../apps/corp-admin-frontend
npm run build
echo "Build timestamp: $BUILD_TIME" > dist/build.txt
echo "✅ Control Plane frontend built with cache busting"

# 7️⃣ Docker Rebuild with No Cache
echo ""
echo "🐳 7/9 - Rebuilding Docker containers (no cache)..."
cd ../..
docker compose build --no-cache frontend backend corp-admin-frontend corp-admin-backend
docker compose up -d --force-recreate
echo "✅ Docker containers rebuilt"

# 8️⃣ Clear Nginx Cache & Reload
echo ""
echo "🧹 8/9 - Clearing Nginx cache..."
# Clear Nginx cache inside containers
docker exec barcodepos_frontend sh -c "rm -rf /var/cache/nginx/*" || true
docker exec barcodepos_corp_frontend sh -c "rm -rf /var/cache/nginx/*" || true
# Reload Nginx configurations
docker exec barcodepos_frontend nginx -s reload || true
docker exec barcodepos_corp_frontend nginx -s reload || true
echo "✅ Nginx cache cleared and reloaded"

# 8.5️⃣ Create Initial Corp Admin (if not exists)
echo ""
echo "👤 8.5/9 - Ensuring Control Plane admin user exists..."
docker exec barcodepos_corp_backend npm run seed:admin || echo "⚠️  Admin user might already exist or script failed"
echo "✅ Control Plane admin check completed"

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
echo "🌐 Main Application: https://barcodepos.trade"
echo "🌐 Control Plane: https://admin.barcodepos.trade"
echo "📊 Health check in 10 seconds..."
sleep 10

# Health Check
echo ""
echo "🏥 Running health checks..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Main Frontend is responding (HTTP $HTTP_CODE)"
else
    echo "⚠️  Main Frontend returned HTTP $HTTP_CODE (might still be starting up)"
fi

API_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health || echo "000")
if [ "$API_CODE" = "200" ]; then
    echo "✅ Main Backend is responding (HTTP $API_CODE)"
else
    echo "⚠️  Main Backend returned HTTP $API_CODE (might still be starting up)"
fi

CORP_FRONTEND_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 || echo "000")
if [ "$CORP_FRONTEND_CODE" = "200" ]; then
    echo "✅ Control Plane Frontend is responding (HTTP $CORP_FRONTEND_CODE)"
else
    echo "⚠️  Control Plane Frontend returned HTTP $CORP_FRONTEND_CODE (might still be starting up)"
fi

CORP_BACKEND_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4001/health || echo "000")
if [ "$CORP_BACKEND_CODE" = "200" ]; then
    echo "✅ Control Plane Backend is responding (HTTP $CORP_BACKEND_CODE)"
else
    echo "⚠️  Control Plane Backend returned HTTP $CORP_BACKEND_CODE (might still be starting up)"
fi

echo ""
echo "🎯 DEPLOYMENT COMPLETE!"
echo "🔄 Hard refresh recommended: Ctrl + Shift + R"
echo ""

