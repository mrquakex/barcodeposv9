#!/bin/bash

# DNS Kontrol Scripti
# Bu script DNS kaydının yayıldığını kontrol eder

DOMAIN="admin.barcodepos.trade"
SERVER_IP="130.61.95.26"

echo "🔍 DNS Kaydı Kontrol Ediliyor: $DOMAIN"
echo "================================================"

# DNS Kaydını Kontrol Et
RESOLVED_IP=$(dig +short $DOMAIN @8.8.8.8 | tail -1)

if [ -z "$RESOLVED_IP" ]; then
    echo "❌ DNS kaydı henüz yayılmamış veya bulunamadı"
    echo ""
    echo "📋 Yapılacaklar:"
    echo "1. Domain yönetim paneline giriş yap (barcodepos.trade domain sağlayıcısı)"
    echo "2. DNS kayıtlarına git"
    echo "3. Yeni bir 'A' kaydı ekle:"
    echo "   - Type: A"
    echo "   - Name: admin (veya @ veya boş bırak)"
    echo "   - Value/Points to: $SERVER_IP"
    echo "   - TTL: 3600 (veya varsayılan)"
    echo ""
    echo "4. Kaydı kaydet ve 5-10 dakika bekle"
    echo "5. Bu scripti tekrar çalıştır: ./check-dns.sh"
    exit 1
fi

if [ "$RESOLVED_IP" = "$SERVER_IP" ]; then
    echo "✅ DNS kaydı doğru yayılmış!"
    echo "   $DOMAIN → $RESOLVED_IP"
    echo ""
    echo "🎉 Şimdi SSL sertifikası kurulabilir:"
    echo "   ssh oracle-vm \"cd /home/ubuntu/barcodeposv9 && ./setup-ssl-admin.sh\""
else
    echo "⚠️  DNS kaydı yanlış!"
    echo "   Beklenen IP: $SERVER_IP"
    echo "   Bulunan IP: $RESOLVED_IP"
    echo ""
    echo "Domain yönetim panelinden DNS kaydını kontrol et."
    exit 1
fi

