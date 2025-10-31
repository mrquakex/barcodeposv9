#!/bin/bash
# SSL Setup Script for admin.barcodepos.trade
# Run this AFTER DNS A record is added: admin.barcodepos.trade -> <server-ip>

echo "🔐 SSL Setup for admin.barcodepos.trade"
echo "=========================================="
echo ""

# Check DNS
echo "📡 Checking DNS..."
if dig +short admin.barcodepos.trade A | grep -q .; then
    DNS_IP=$(dig +short admin.barcodepos.trade A | head -1)
    SERVER_IP="130.61.95.26"  # Oracle Cloud public IP
    echo "✅ DNS found: admin.barcodepos.trade -> $DNS_IP"
    echo "📡 Server IP: $SERVER_IP"
    
    if [ "$DNS_IP" = "$SERVER_IP" ]; then
        echo "✅ DNS points to this server"
    else
        echo "⚠️  DNS IP ($DNS_IP) doesn't match server IP ($SERVER_IP)"
        echo "   Please update DNS A record and wait 5-10 minutes"
        exit 1
    fi
else
    echo "❌ DNS record not found for admin.barcodepos.trade"
    echo "   Please add A record: admin.barcodepos.trade -> <server-ip>"
    exit 1
fi

echo ""
echo "🔒 Getting SSL certificate..."
sudo certbot --nginx -d admin.barcodepos.trade \
    --non-interactive \
    --agree-tos \
    --email admin@barcodepos.trade \
    --redirect

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SSL certificate installed successfully!"
    echo ""
    echo "🌐 Access your Control Plane at:"
    echo "   https://admin.barcodepos.trade"
    echo ""
    echo "🔐 Login credentials:"
    echo "   Email: superadmin@barcodepos.trade"
    echo "   Password: elwerci12"
else
    echo ""
    echo "❌ SSL certificate installation failed"
    echo "   Please check DNS propagation and try again"
    exit 1
fi

