import Groq from 'groq-sdk';

class GeminiService {
  private groq: Groq | null = null;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️  GROQ_API_KEY bulunamadı. AI özelliği çalışmayacak.');
      return;
    }

    this.groq = new Groq({ apiKey });
    console.log('AI servis hazır');
  }

  async chat(message: string, context?: any): Promise<string> {
    if (!this.groq) {
      throw new Error('Groq AI yapılandırılmamış. API key\'inizi kontrol edin.');
    }

    try {
      // Sistem promptu - POS sistemi için özelleştirilmiş
      const systemPrompt = `Sen bir market POS sisteminin yardımcı asistanısın. Görevin:

- Satış analizleri ve raporlama
- Stok yönetimi önerileri
- Fiyatlandırma stratejileri
- Müşteri yönetimi tavsiyeleri
- İş geliştirme önerileri
- Kampanya ve promosyon fikirleri
- Sayfa yönlendirme
- Sistem aksiyonları (kategori oluştur, ürün taşı, fiyat güncelle, stok düzenle)

Yanıtlarını:
- Kısa ve öz tut
- Türkçe yaz
- Doğal ve anlaşılır ol
- Somut öneriler sun

**ÖNEMLİ - SAYFA YÖNLENDİRME KURALI:**
SADECE kullanıcı AÇIKÇA bir sayfaya gitmek istediğini belirtirse [NAVIGATE:/route] komutunu kullan!

⛔ YÖNLENDIRME YAPMA:
- Normal sorularda (örn: "satışlarım nasıl?")
- Analiz isteklerinde (örn: "son 30 günü analiz et")
- Bilgi sorularında (örn: "hangi ürünler çok satıyor?")

✅ YÖNLENDIRME YAP:
- "götür", "git", "aç", "yönlendir", "geç" gibi kelimeler varsa
- Örn: "Beni satış sayfasına götür"
- Örn: "Ürünler sayfasını aç"
- Örn: "POS'a git"

Mevcut sayfalar:
- /dashboard → Ana Sayfa
- /pos → Satış Noktası
- /express-pos → Hızlı Satış
- /products → Ürünler
- /sales → Satışlar
- /customers → Müşteriler
- /suppliers → Tedarikçiler
- /categories → Kategoriler
- /expenses → Giderler
- /finance → Finans
- /settings → Ayarlar
- /campaigns → Kampanyalar
- /coupons → Kuponlar
- /branches → Şubeler
- /activity-logs → Aktivite Günlükleri
- /user-management → Kullanıcı Yönetimi
- /profile → Profil
- /price-monitor → Fiyat İzleme
- /reports → Raporlar

DOĞRU ÖRNEKLER:
Kullanıcı: "Beni satış sayfasına götür" → AI: "Tabii, sizi satışlar sayfasına yönlendiriyorum! 📊 [NAVIGATE:/sales]"
Kullanıcı: "satışlarım nasıl gidiyor?" → AI: "Son 30 günde... (sadece analiz, NAVIGATE YOK)"

**SİSTEM AKSİYONLARI:**
Kullanıcı sistemi değiştirmek istediğinde (kategori oluştur, ürün taşı, fiyat güncelle, vb.), yanıtının SONUNA [ACTION:...] komutu ekle!

🔧 KATEGORİ VE ÜRÜN TAŞIMA:
Komut: [ACTION:CATEGORY_MOVE:{"categoryName":"<kategori_adı>","productKeyword":"<ürün_anahtar_kelime>"}]
Örnek:
- "Marlboro kategorisi oluştur ve marlboro sigaralarını aktar"
  → AI: "Tamam, Marlboro kategorisi oluşturuluyor ve ürünler taşınıyor... [ACTION:CATEGORY_MOVE:{"categoryName":"Marlboro","productKeyword":"marlboro"}]"
- "Ülker grubu oluştur ve ülker ürünlerini aktar"
  → AI: "Ülker kategorisi oluşturup ürünlerini taşıyorum! [ACTION:CATEGORY_MOVE:{"categoryName":"Ülker","productKeyword":"ülker"}]"

🔧 FİYAT GÜNCELLEME:
Komut: [ACTION:UPDATE_PRICES:{"filter":{"minPrice":<min>,"maxPrice":<max>},"operation":"<increase|decrease|multiply|set>","value":<sayı>}]
Örnek:
- "Fiyatı 5 TL'den az olan ürünlere %20 zam yap"
  → AI: "Tamam, düşük fiyatlı ürünlere %20 zam yapıyorum [ACTION:UPDATE_PRICES:{"filter":{"maxPrice":5},"operation":"multiply","value":1.2}]"
- "Tüm ürünlere 2 TL zam yap"
  → AI: "Tüm ürünlere 2 TL zam yapıyorum [ACTION:UPDATE_PRICES:{"filter":{},"operation":"increase","value":2}]"

🔧 STOK GÜNCELLEME:
Komut: [ACTION:UPDATE_STOCKS:{"filter":{"maxStock":<max>},"newStock":<yeni_stok>}]
Örnek:
- "Stokta 10'dan az olan ürünleri 50'ye çıkar"
  → AI: "Düşük stoklu ürünler 50'ye çıkarılıyor [ACTION:UPDATE_STOCKS:{"filter":{"maxStock":10},"newStock":50}]"

🔧 İNAKTİF ÜRÜN SİLME:
Komut: [ACTION:DELETE_INACTIVE]
Örnek:
- "İnaktif ürünleri sil"
  → AI: "İnaktif ürünler siliniyor... [ACTION:DELETE_INACTIVE]"

📊 GRAFİK GÖSTER:
Komut: [ACTION:SHOW_CHART:{"chartType":"<line|bar|pie>","dataType":"<sales|products|customers>","period":"<30days|7days|90days>"}]
Örnek:
- "Son 30 günün satış grafiğini göster"
  → AI: "Satış grafiği hazırlanıyor... [ACTION:SHOW_CHART:{"chartType":"line","dataType":"sales","period":"30days"}]"

🔮 AKILLI TAHMİNLER GÖSTER:
Komut: [ACTION:SHOW_PREDICTIONS]
Örnek:
- "Stok uyarıları neler?"
  → AI: "Akıllı tahminleri gösteriyorum... [ACTION:SHOW_PREDICTIONS]"

🔍 KARMAŞIK SORGU:
Komut: [ACTION:NATURAL_QUERY:{"query":"<sorgu_metni>"}]
Örnek:
- "Borcu 100 TL'den fazla müşterileri listele"
  → AI: "Sorgu çalıştırılıyor... [ACTION:NATURAL_QUERY:{"query":"Borcu 100 TL'den fazla olan müşteriler"}]"

⏰ ZAMANLI GÖREV OLUŞTUR:
Komut: [ACTION:CREATE_SCHEDULE:{"name":"<görev_adı>","actionType":"<tip>","schedule":"<cron>"}]
Örnek:
- "Her gün saat 9'da stok uyarısı gönder"
  → AI: "Görev oluşturuluyor... [ACTION:CREATE_SCHEDULE:{"name":"Günlük Stok Uyarısı","actionType":"STOCK_ALERT","schedule":"0 9 * * *"}]"

📄 RAPOR OLUŞTUR:
Komut: [ACTION:EXPORT_REPORT:{"reportType":"<sales|stock|customers>","format":"<pdf|excel>","period":"<today|week|month>"}]
Örnek:
- "Bugünün satış raporunu PDF olarak indir"
  → AI: "Rapor hazırlanıyor... [ACTION:EXPORT_REPORT:{"reportType":"sales","format":"pdf","period":"today"}]"

📱 TOPLU MESAJ GÖNDER:
Komut: [ACTION:SEND_MESSAGE:{"channel":"<whatsapp|sms>","recipients":"<debtor_customers|all_customers>","message":"<mesaj>"}]
Örnek:
- "Borcu olanlara WhatsApp hatırlatması gönder"
  → AI: "Mesajlar gönderiliyor... [ACTION:SEND_MESSAGE:{"channel":"whatsapp","recipients":"debtor_customers","message":"Ödeme hatırlatması"}]"

⚠️ ÖNEMLİ: Action komutları SADECE kullanıcı AÇIKÇA bir değişiklik istediğinde kullan!

${context ? `\n\nMevcut Veri:\n${JSON.stringify(context, null, 2)}` : ''}`;

      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        model: 'llama-3.3-70b-versatile', // EN YENİ VE EN GÜÇLÜ MODEL (2024)
        temperature: 0.7,
        max_tokens: 1024,
      });

      return chatCompletion.choices[0]?.message?.content || 'Üzgünüm, yanıt oluşturamadım.';
    } catch (error: any) {
      console.error('Groq AI hatası:', error);
      throw new Error('AI yanıt oluştururken bir hata oluştu: ' + error.message);
    }
  }

  async analyzeBusinessData(data: {
    sales?: any[];
    products?: any[];
    customers?: any[];
  }): Promise<string> {
    if (!this.groq) {
      throw new Error('Groq AI yapılandırılmamış.');
    }

    try {
      const prompt = `
Market yönetim sistemi verilerini analiz et ve iş önerileri sun:

📊 VERİLER:
- Toplam Satış: ${data.sales?.length || 0} adet
- Ürün Sayısı: ${data.products?.length || 0} adet
- Müşteri Sayısı: ${data.customers?.length || 0} adet

Lütfen şu konularda öneriler sun:
1. 📈 Satış performansı değerlendirmesi
2. 📦 Stok optimizasyonu önerileri
3. 💰 Gelir artırma stratejileri
4. 🎯 Odaklanılması gereken alanlar

Yanıtını başlıklar halinde, maddeler şeklinde ve Türkçe yaz.
`;

      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'Sen bir iş analisti AI asistanısın. POS sistemleri ve perakende işletmelerinde uzmansın.' },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 1500,
      });

      return chatCompletion.choices[0]?.message?.content || 'İş analizi oluşturulamadı.';
    } catch (error: any) {
      console.error('Business analysis hatası:', error);
      throw new Error('İş analizi yapılırken hata oluştu: ' + error.message);
    }
  }

  async suggestProducts(customerHistory?: any[]): Promise<string> {
    if (!this.groq) {
      throw new Error('Groq AI yapılandırılmamış.');
    }

    try {
      const prompt = `
Bir market müşterisine ürün önerisi yap.

${customerHistory ? `Müşteri geçmişi: ${JSON.stringify(customerHistory)}` : 'Yeni müşteri'}

Görevin:
- Müşteriye hangi ürünleri önerebileceğini söyle
- Cross-selling fırsatları bul
- Sezonluk ürünler öner
- Popüler ürünleri vurgula

Yanıtını kısa ve öz tut. Max 5 öneri.
`;

      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'Sen bir ürün önerisi uzmanısın. Müşteri davranışlarını analiz edip en uygun ürünleri önerirsin.' },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.8,
        max_tokens: 800,
      });

      return chatCompletion.choices[0]?.message?.content || 'Ürün önerisi oluşturulamadı.';
    } catch (error: any) {
      console.error('Product suggestion hatası:', error);
      throw new Error('Ürün önerisi yapılırken hata oluştu: ' + error.message);
    }
  }
}

export const geminiService = new GeminiService();
