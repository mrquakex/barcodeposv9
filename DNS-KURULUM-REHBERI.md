# DNS Kaydı Kurulum Rehberi

## 🎯 Amaç
`admin.barcodepos.trade` subdomain'ini sunucu IP'sine (`130.61.95.26`) yönlendirmek için DNS A kaydı eklemek.

---

## 📋 Adım Adım Kurulum

### 1️⃣ Domain Yönetim Paneline Giriş
- `barcodepos.trade` domain'inin yönetim paneline giriş yap
- DNS/DNS Records/Zone Editor bölümüne git

### 2️⃣ A Kaydı Ekle
Yeni bir **A Record** ekle:

| Alan | Değer |
|------|-------|
| **Type** | `A` |
| **Name/Host** | `admin` |
| **Points to/Value** | `130.61.95.26` |
| **TTL** | `3600` (1 saat - varsayılan) |

**Not:** Bazı panellerde:
- Name alanına sadece `admin` yaz (`.` olmadan)
- Bazılarında `admin.barcodepos.trade` tam domain'i yazman gerekebilir
- Bazılarında `@` veya boş bırakırsan ana domain'e ekler

### 3️⃣ Kaydet ve Bekle
- DNS kaydını kaydet
- **5-10 dakika** bekle (DNS propagation süresi)

### 4️⃣ DNS Yayılımını Kontrol Et

#### Windows PowerShell'den:
```powershell
nslookup admin.barcodepos.trade
```

#### Veya tarayıcıdan:
https://www.whatsmydns.net/#A/admin.barcodepos.trade

#### Veya bu scripti çalıştır:
```bash
ssh oracle-vm "cd /home/ubuntu/barcodeposv9 && bash check-dns.sh"
```

**Beklenen Sonuç:** `admin.barcodepos.trade` → `130.61.95.26`

### 5️⃣ SSL Sertifikası Kur
DNS yayıldıktan sonra SSL kurulumunu başlat:

```bash
ssh oracle-vm "cd /home/ubuntu/barcodeposv9 && ./setup-ssl-admin.sh"
```

---

## 🔍 DNS Yayılım Kontrolü

### Manuel Kontrol
```bash
dig admin.barcodepos.trade @8.8.8.8
# veya
nslookup admin.barcodepos.trade 8.8.8.8
```

### Otomatik Kontrol
```bash
# Sunucudan kontrol et
ssh oracle-vm "dig +short admin.barcodepos.trade @8.8.8.8"
```

---

## ⚠️ Yaygın Sorunlar

### DNS henüz yayılmadı
- **Çözüm:** 10-15 dakika daha bekle
- TTL değerine bağlı olarak 1 saat kadar sürebilir

### Yanlış IP gösteriyor
- **Çözüm:** Domain panelinden DNS kaydını kontrol et
- A kaydının `130.61.95.26` olduğundan emin ol

### DNS kaydı bulunamıyor
- **Çözüm:** 
  1. Domain panelinden kaydın kaydedildiğini kontrol et
  2. Name alanının doğru yazıldığından emin ol (`admin`)
  3. Domain sağlayıcısının DNS sunucularının güncel olduğundan emin ol

---

## ✅ Başarı Kontrolü

DNS doğru yayıldığında:
- `dig admin.barcodepos.trade` komutu `130.61.95.26` döndürmeli
- `http://admin.barcodepos.trade` tarayıcıda açılmalı (HTTP)
- SSL kurulumu başlatılabilir

---

## 📞 Yardım

DNS kaydını ekledikten sonra bu scripti çalıştırarak kontrol edebilirsin:
```bash
bash check-dns.sh
```

Veya sunucudan direkt kontrol et:
```bash
ssh oracle-vm "dig +short admin.barcodepos.trade"
```

