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
    console.log('✅ Groq AI başlatıldı! (Model: llama-3.3-70b-versatile) ⚡');
  }

  async chat(message: string, context?: any): Promise<string> {
    if (!this.groq) {
      throw new Error('Groq AI yapılandırılmamış. API key\'inizi kontrol edin.');
    }

    try {
      // Sistem promptu - POS sistemi için özelleştirilmiş
      const systemPrompt = `Sen bir Market ve POS (Point of Sale) sistemi için AI asistanısın. 
Adın "BarcodePOS AI" ve görevin kullanıcılara aşağıdaki konularda yardımcı olmak:

- 📊 Satış analizleri ve raporlama
- 📦 Stok yönetimi önerileri
- 💰 Fiyatlandırma stratejileri
- 👥 Müşteri yönetimi tavsiyeleri
- 📈 İş geliştirme önerileri
- 🎯 Kampanya ve promosyon fikirleri
- 🧭 Sayfa yönlendirme (kullanıcıyı istediği sayfaya götür)

Yanıtlarını:
- Kısa ve öz tut
- Türkçe yaz
- Profesyonel ama samimi ol
- Emoji kullan (ama abartma)
- Somut öneriler sun

**SAYFA YÖNLENDİRME:**
Eğer kullanıcı bir sayfaya gitmek isterse, yanıtının SONUNA şu formatı ekle:
[NAVIGATE:/route]

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
- /ai-chat → AI Asistan
- /price-monitor → Fiyat İzleme
- /reports → Raporlar

ÖRNEK:
Kullanıcı: "Beni satış sayfasına götür"
AI: "Tabii, sizi satışlar sayfasına yönlendiriyorum! 📊 [NAVIGATE:/sales]"

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
