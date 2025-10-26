import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️  GEMINI_API_KEY bulunamadı. AI özelliği çalışmayacak.');
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    console.log('✅ Gemini AI başlatıldı!');
  }

  async chat(message: string, context?: any): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini AI yapılandırılmamış. API key\'inizi kontrol edin.');
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

Yanıtlarını:
- Kısa ve öz tut
- Türkçe yaz
- Profesyonel ama samimi ol
- Emoji kullan (ama abartma)
- Somut öneriler sun

${context ? `\n\nMevcut Veri:\n${JSON.stringify(context, null, 2)}` : ''}`;

      const fullPrompt = `${systemPrompt}\n\nKullanıcı: ${message}\n\nAsistan:`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('Gemini AI hatası:', error);
      throw new Error('AI yanıt oluştururken bir hata oluştu: ' + error.message);
    }
  }

  async analyzeBusinessData(data: {
    sales?: any[];
    products?: any[];
    customers?: any[];
  }): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini AI yapılandırılmamış.');
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

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('Business analysis hatası:', error);
      throw new Error('İş analizi yapılırken hata oluştu: ' + error.message);
    }
  }

  async suggestProducts(customerHistory?: any[]): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini AI yapılandırılmamış.');
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

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('Product suggestion hatası:', error);
      throw new Error('Ürün önerisi yapılırken hata oluştu: ' + error.message);
    }
  }
}

export const geminiService = new GeminiService();

