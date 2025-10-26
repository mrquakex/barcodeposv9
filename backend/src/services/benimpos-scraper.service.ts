import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import prisma from '../lib/prisma';

interface ScrapedProduct {
  name: string;
  barcode: string | null;
  price: number;
  stock?: number;
  additionalData?: any;
}

interface PriceChangeResult {
  productId: string;
  productName: string;
  barcode: string;
  oldPrice: number;
  newPrice: number;
  difference: number;
  percentage: number;
}

class BenimPOSScraperService {
  private browser: Browser | null = null;
  private page: Page | null = null;

  /**
   * Login to BenimPOS
   */
  async login(): Promise<{ browser: Browser; page: Page }> {
    console.log('🔐 BenimPOS login başlatılıyor...');

    // Get credentials from database
    const config = await prisma.scraperConfig.findUnique({
      where: { source: 'BENIMPOS' }
    });

    if (!config) {
      throw new Error('BenimPOS scraper ayarları bulunamadı!');
    }

    if (!config.isActive) {
      throw new Error('BenimPOS scraper devre dışı!');
    }

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
      ],
    });

    this.page = await this.browser.newPage();

    // Set user agent (anti-bot)
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Set viewport
    await this.page.setViewport({ width: 1920, height: 1080 });

    try {
      // Go to login page
      console.log('📄 Login sayfası açılıyor...');
      await this.page.goto('https://www.benimpos.com/login', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait a bit (anti-bot)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Fill login form
      console.log('✍️  Login formu doldruluyor...');
      
      // Email input
      await this.page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
      await this.page.type('input[type="email"], input[name="email"]', config.email, { delay: 100 });

      // Password input
      await this.page.waitForSelector('input[type="password"], input[name="password"]', { timeout: 10000 });
      await this.page.type('input[type="password"], input[name="password"]', config.password, { delay: 100 });

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

      // Click submit button
      console.log('🚀 Login formu gönderiliyor...');
      await this.page.click('button[type="submit"]');

      // Wait for navigation
      await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

      console.log('✅ Login başarılı!');
      
      return { browser: this.browser, page: this.page };
    } catch (error: any) {
      console.error('❌ Login hatası:', error.message);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Scrape products from BenimPOS
   */
  async scrapeProducts(page: Page): Promise<ScrapedProduct[]> {
    console.log('🕷️  Ürünler sayfası scraping başlatılıyor...');

    try {
      // Go to products page
      await page.goto('https://www.benimpos.com/products', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for products to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get HTML content
      const html = await page.content();

      // Parse with Cheerio
      const $ = cheerio.load(html);

      const products: ScrapedProduct[] = [];

      // Try different selectors (site yapısına göre güncellenecek)
      const productSelectors = [
        '.product-item',
        '.product-card',
        '[data-product]',
        '.item',
      ];

      let foundProducts = false;

      for (const selector of productSelectors) {
        const items = $(selector);
        if (items.length > 0) {
          console.log(`✅ ${items.length} ürün bulundu (${selector})`);
          foundProducts = true;

          items.each((i, el) => {
            const $el = $(el);
            
            // Extract product data (selectors will need adjustment based on actual HTML)
            const name = $el.find('.product-name, .name, h3, h4').first().text().trim();
            const priceText = $el.find('.price, .product-price, .amount').first().text().trim();
            const barcodeText = $el.find('.barcode, [data-barcode]').first().text().trim() 
                              || $el.attr('data-barcode')
                              || null;
            
            // Parse price
            const price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.'));

            if (name && !isNaN(price)) {
              products.push({
                name,
                barcode: barcodeText,
                price,
              });
            }
          });

          break;
        }
      }

      if (!foundProducts) {
        console.warn('⚠️  Ürün bulunamadı! HTML yapısı kontrol edilmeli.');
        // Save HTML for debugging
        console.log('📝 HTML içeriği ilk 500 karakter:');
        console.log(html.substring(0, 500));
      }

      console.log(`✅ Toplam ${products.length} ürün çıkarıldı`);
      return products;

    } catch (error: any) {
      console.error('❌ Scraping hatası:', error.message);
      throw error;
    }
  }

  /**
   * Compare scraped prices with our database
   */
  async comparePrices(scrapedProducts: ScrapedProduct[]): Promise<PriceChangeResult[]> {
    console.log('⚖️  Fiyat karşılaştırması yapılıyor...');

    const changes: PriceChangeResult[] = [];

    for (const scraped of scrapedProducts) {
      try {
        // Find product in our database by barcode or name
        let ourProduct = null;

        if (scraped.barcode) {
          ourProduct = await prisma.product.findFirst({
            where: {
              OR: [
                { barcode: scraped.barcode },
                { name: { contains: scraped.name, mode: 'insensitive' } }
              ]
            }
          });
        } else {
          ourProduct = await prisma.product.findFirst({
            where: { name: { contains: scraped.name, mode: 'insensitive' } }
          });
        }

        if (ourProduct && Math.abs(ourProduct.price - scraped.price) > 0.01) {
          const difference = scraped.price - ourProduct.price;
          const percentage = (difference / ourProduct.price) * 100;

          changes.push({
            productId: ourProduct.id,
            productName: ourProduct.name,
            barcode: ourProduct.barcode,
            oldPrice: ourProduct.price,
            newPrice: scraped.price,
            difference,
            percentage,
          });

          // Save to database
          await prisma.priceChange.create({
            data: {
              productId: ourProduct.id,
              source: 'BENIMPOS',
              oldPrice: ourProduct.price,
              newPrice: scraped.price,
              difference,
              percentage,
              status: 'PENDING',
              scrapedData: scraped.additionalData || {},
            },
          });
        }
      } catch (error: any) {
        console.error(`❌ Ürün karşılaştırma hatası (${scraped.name}):`, error.message);
      }
    }

    console.log(`✅ ${changes.length} fiyat değişikliği tespit edildi`);
    return changes;
  }

  /**
   * Run full scraping process
   */
  async runScraping(): Promise<{ success: boolean; changes: PriceChangeResult[]; error?: string }> {
    const startTime = Date.now();
    console.log('🚀 BenimPOS scraping başlatılıyor...', new Date().toISOString());

    try {
      // Update scraper config - set lastRun
      await prisma.scraperConfig.updateMany({
        where: { source: 'BENIMPOS' },
        data: { lastRun: new Date() }
      });

      // 1. Login
      const { page } = await this.login();

      // 2. Scrape products
      const scrapedProducts = await this.scrapeProducts(page);

      // 3. Compare prices
      const changes = await this.comparePrices(scrapedProducts);

      // 4. Cleanup
      await this.cleanup();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Scraping tamamlandı! Süre: ${duration}s`);

      // Update scraper config - success
      await prisma.scraperConfig.updateMany({
        where: { source: 'BENIMPOS' },
        data: { 
          lastStatus: 'SUCCESS',
          errorMessage: null
        }
      });

      return { success: true, changes };

    } catch (error: any) {
      console.error('❌ Scraping başarısız:', error.message);

      // Update scraper config - error
      await prisma.scraperConfig.updateMany({
        where: { source: 'BENIMPOS' },
        data: { 
          lastStatus: 'ERROR',
          errorMessage: error.message
        }
      });

      await this.cleanup();
      return { success: false, changes: [], error: error.message };
    }
  }

  /**
   * Cleanup browser
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      console.log('🧹 Browser kapatıldı');
    }
  }
}

export default new BenimPOSScraperService();

