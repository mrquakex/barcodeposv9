import Groq from 'groq-sdk';

class GroqService {
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
      // Sistem promptu - HIZLI VE ÖZ
      const systemPrompt = `Sen bir POS sistemi asistanısın. KISA ve ÖZ yanıt ver!

📊 CONTEXT VERİSİ:
${context ? `
- Bugün: ${context.today?.sales || 0} satış, ${context.today?.revenue || 0} TL
- Bu Ay: ${context.month?.sales || 0} satış, ${context.month?.revenue || 0} TL
- Stok: ${context.inventory?.total || 0} ürün (${context.inventory?.critical || 0} kritik, ${context.inventory?.low || 0} düşük)
- Müşteriler: ${context.customers || 0}
` : ''}

KURALLAR:
1. KISA yanıt ver (max 2-3 cümle)
2. Context'teki sayıları kullan
3. Türkçe konuş
4. Sayfa değişimi için [NAVIGATE:/route] kullan

SAYFA YÖNLENDİRME:
"götür/git/aç" kelimesi varsa → [NAVIGATE:/route]
Ana sayfa=/dashboard, Satışlar=/sales, Ürünler=/products, Müşteriler=/customers, Raporlar=/reports

AKSİYONLAR (sadece kullanıcı açıkça isterse):
- Ürün ekle: [ACTION:CREATE_PRODUCT:{"name":"X","sellPrice":Y}]
- Ürün sil: [ACTION:DELETE_PRODUCT:{"productName":"X"}]
- Sorgu: [ACTION:NATURAL_QUERY:{"query":"X"}]
`;

      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        model: 'llama-3.1-8b-instant', // 🚀 HIZLI MODEL
        temperature: 0.5, // Daha tutarlı yanıtlar
        max_tokens: 300, // Çok daha kısa yanıtlar
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

export const groqService = new GroqService();
