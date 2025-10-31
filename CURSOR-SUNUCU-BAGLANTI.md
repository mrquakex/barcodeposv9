# 🔌 CURSOR'DA SUNUCUYA BAĞLANMA REHBERİ

## YÖNTEM 1: Remote SSH Extension (ÖNERİLEN) ⭐

### Adım 1: Extension Kurulumu
1. Cursor'da `Ctrl+Shift+X` (Windows) veya `Cmd+Shift+X` (Mac) ile Extensions açın
2. "Remote - SSH" yazıp aratın
3. **"Remote - SSH"** extension'ını kurun (Microsoft tarafından)

### Adım 2: SSH Config Dosyası Oluştur
1. Windows'ta: `C:\Users\KULLANICI_ADIN\.ssh\config` dosyasını oluştur/düzenle
2. Mac/Linux'ta: `~/.ssh/config` dosyasını oluştur/düzenle

**İçerik:**
```
Host barcodepos-server
    HostName 130.61.95.26
    User opc
    Port 22
    IdentityFile ~/.ssh/id_rsa
```

**NOT:** Eğer SSH key'iniz farklı bir yerdeyse `IdentityFile` path'ini güncelleyin.

### Adım 3: Cursor'dan Bağlan
1. Cursor'da sol alttaki yeşil `><` butonuna tıklayın
2. Veya `F1` tuşuna basıp "Remote-SSH: Connect to Host" yazın
3. **"barcodepos-server"** seçin (config'de tanımladığınız isim)
4. Yeni bir Cursor penceresi açılacak
5. Şifre sorarsa Oracle Cloud'tan aldığınız SSH key şifresini girin

### Adım 4: Projeyi Aç
Bağlandıktan sonra:
1. `File` → `Open Folder`
2. `/home/opc/barcodeposv9` klasörünü seçin
3. Artık sunucudaki dosyaları Cursor'da düzenleyebilirsiniz! ✅

---

## YÖNTEM 2: Terminal'den SSH (Hızlı)

### Adım 1: Cursor Terminal'den Bağlan
1. Cursor'da `Ctrl+` (backtick) veya `View` → `Terminal`
2. Terminal'de:
```bash
ssh opc@130.61.95.26
```

### Adım 2: Proje Klasörüne Git
```bash
cd /home/opc/barcodeposv9
```

**NOT:** Bu yöntemle bağlanırsanız sadece terminal'den komut çalıştırabilirsiniz, dosyaları Cursor'da düzenleyemezsiniz.

---

## YÖNTEM 3: SFTP/SSH Extension (Dosya Transfer)

### Adım 1: Extension Kur
1. Extensions'da "SFTP" veya "SSH FS" aratın
2. Birini kurun (ör: "SFTP" by Natizyskunk)

### Adım 2: Config Ayarla
Extension'ın config dosyasına:
```json
{
    "host": "130.61.95.26",
    "username": "opc",
    "port": 22,
    "remotePath": "/home/opc/barcodeposv9"
}
```

---

## 🔑 SSH KEY YOKSA

### Oracle Cloud'tan SSH Key İndir:
1. Oracle Cloud Console'a git
2. Compute → Instance'ınızı seç
3. **"SSH Keys"** sekmesine git
4. Private key'i indir (`.pem` dosyası)

### Windows'ta Key'i Kullan:
1. Key'i `C:\Users\KULLANICI_ADIN\.ssh\` klasörüne koy
2. `id_rsa` veya `oracle_key.pem` olarak kaydet
3. SSH config'te `IdentityFile` path'ini ayarla

### Mac/Linux'ta Key'i Kullan:
```bash
chmod 600 ~/.ssh/oracle_key.pem
ssh -i ~/.ssh/oracle_key.pem opc@130.61.95.26
```

---

## ✅ BAĞLANTIYI TEST ET

### Terminal'den:
```bash
ssh opc@130.61.95.26 "echo 'Bağlantı başarılı!'"
```

### Veya:
```bash
ssh opc@130.61.95.26
cd /home/opc/barcodeposv9
ls -la
```

---

## 🎯 ÖNERİLEN YÖNTEM

**Remote SSH Extension** kullanın çünkü:
- ✅ Dosyaları doğrudan Cursor'da düzenleyebilirsiniz
- ✅ Terminal'den komut çalıştırabilirsiniz
- ✅ Git işlemlerini Cursor'dan yapabilirsiniz
- ✅ Extension'lar sunucuda çalışır
- ✅ VS Code gibi tam entegrasyon

---

## ⚠️ SORUN ÇIKARSA

### "Permission denied" hatası:
- SSH key izinlerini kontrol edin: `chmod 600 ~/.ssh/id_rsa`
- Key path'ini kontrol edin

### "Host key verification failed":
```bash
ssh-keygen -R 130.61.95.26
```

### "Connection refused":
- Oracle Cloud Security List'te port 22 açık mı kontrol edin
- Firewall ayarlarını kontrol edin

---

## 📝 HIZLI BAŞLANGIÇ

1. Remote SSH extension kur
2. SSH config oluştur (yukarıdaki gibi)
3. Cursor'da `F1` → "Remote-SSH: Connect to Host" → "barcodepos-server"
4. `/home/opc/barcodeposv9` klasörünü aç
5. **Hazırsın!** 🎉

