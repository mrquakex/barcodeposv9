import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import prisma from '../lib/prisma';
import { io } from '../server'; // ✅ Socket.IO import

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

interface NewProductResult {
  name: string;
  barcode: string | null;
  price: number;
  source: string;
}

class BenimPOSScraperService {
  private browser: Browser | null = null;
  private page: Page | null = null;

  /**
   * Login to BenimPOS
   */
  async login(): Promise<{ browser: Browser; page: Page }> {
    console.log('🔐 Tedarikçi sistemine bağlanılıyor...');

    // Get credentials from database
    const config = await prisma.scraperConfig.findUnique({
      where: { source: 'BENIMPOS' }
    });

    if (!config) {
      throw new Error('Tarama ayarları bulunamadı!');
    }

    if (!config.isActive) {
      throw new Error('Fiyat tarama sistemi devre dışı!');
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
      
      // ✅ CORRECT SELECTORS FROM REAL BENIMPOS HTML (Turkish field names!)
      // Email input: name="eposta" (NOT "email"!)
      await this.page.waitForSelector('input[name="eposta"]', { timeout: 10000 });
      await this.page.type('input[name="eposta"]', config.email, { delay: 100 });

      // Password input: name="parola" (NOT "password"!)
      await this.page.waitForSelector('input[name="parola"]', { timeout: 10000 });
      await this.page.type('input[name="parola"]', config.password, { delay: 100 });

      // Wait a bit (anti-bot)
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

      // Click submit button: name="giris" (Turkish!)
      console.log('🚀 Login formu gönderiliyor...');
      await this.page.click('button[type="submit"][name="giris"]');

      // ✅ SMART WAIT: Instead of waiting for navigation, wait for a specific element
      // that appears only after successful login (e.g. dashboard menu, sidebar)
      console.log('⏳ Login sonrası sayfa yükleniyor...');
      
      try {
        // Wait for sidebar (appears after login) - from Console analysis: .leftbar
        await this.page.waitForSelector('.leftbar, a[href*="dashboard"], .fa-th-large', { timeout: 20000 });
        console.log('✅ Login başarılı!');
      } catch (error: any) {
        // Fallback: Check URL
        const currentUrl = this.page.url();
        console.log('📍 Current URL:', currentUrl);
        
        if (currentUrl.includes('dashboard') || currentUrl.includes('products') || !currentUrl.includes('login')) {
          console.log('✅ Login başarılı! (URL kontrolü)');
        } else {
          throw new Error('Login başarısız veya timeout');
        }
      }
      
      return { browser: this.browser, page: this.page };
    } catch (error: any) {
      console.error('❌ Login hatası:', error.message);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Scrape products from BenimPOS
   * 🆕 Now with PAGINATION support - scrapes ALL products!
   */
  async scrapeProducts(page: Page): Promise<ScrapedProduct[]> {
    console.log('🕷️  Ürünler sayfası scraping başlatılıyor...');

    try {
      const allProducts: ScrapedProduct[] = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        console.log(`\n📄 Sayfa ${currentPage} taranıyor...`);

        // Only navigate on first page, use DataTables controls after
        if (currentPage === 1) {
          await page.goto('https://www.benimpos.com/products', {
            waitUntil: 'networkidle2',
            timeout: 30000,
          });
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          // For subsequent pages, use DataTables "Next" button
          console.log(`🖱️  DataTables "Next" butonuna tıklanıyor... (Sayfa ${currentPage})`);
          
          try {
            // Wait for table to be ready
            await page.waitForSelector('#myReportTable', { timeout: 5000 });
            
            // Try multiple selectors for "Next" button
            const nextSelectors = [
              'a.paginate_button.next:not(.disabled)',
              'a#myReportTable_next:not(.disabled)',
              'a[data-dt-idx]:last-child:not(.disabled)',
              '.dataTables_paginate a.next:not(.disabled)'
            ];
            
            let clicked = false;
            for (const selector of nextSelectors) {
              const nextButton = await page.$(selector);
              if (nextButton) {
                await nextButton.click();
                clicked = true;
                console.log(`✅ "Next" butonuna tıklandı (${selector})`);
                break;
              }
            }
            
            if (!clicked) {
              console.log(`⚠️  "Next" butonu bulunamadı, sayfa geçişi yapılamıyor`);
              hasMorePages = false;
              break;
            }
            
            // Wait for AJAX to reload table
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Wait for table to update
            await page.waitForSelector('#myReportTable tbody tr', { timeout: 5000 });
            
          } catch (error: any) {
            console.error(`❌ Sayfa geçiş hatası: ${error.message}`);
            hasMorePages = false;
            break;
          }
        }

        // Get HTML content
        const html = await page.content();

        // Parse with Cheerio
        const $ = cheerio.load(html);

        // ✅ BENIMPOS USES TABLE STRUCTURE
        // Table ID: #myReportTable
        // Each product: tbody > tr
        const table = $('#myReportTable');
        const rows = table.find('tbody tr');

        console.log(`✅ ${rows.length} ürün satırı bulundu (Sayfa ${currentPage})`);

        if (rows.length > 0) {
          rows.each((i, row) => {
            const $row = $(row);
            const tds = $row.find('td');

            if (tds.length >= 10) {
              // TD[3]: Barkod - link içinde
              const barcodeLink = $(tds[3]).find('a').text().trim();
              
              // TD[4]: Ürün Adı - link içinde
              const nameLink = $(tds[4]).find('a').text().trim();
              
              // TD[9]: Fiyat - input value içinde
              const priceInput = $(tds[9]).find('input').val() as string;
              
              // Parse values
              const barcode = barcodeLink || null;
              const name = nameLink || 'Bilinmeyen Ürün';
              const price = parseFloat(priceInput?.replace(/[^\d.,]/g, '').replace(',', '.') || '0');

              if (name && !isNaN(price) && price > 0) {
                allProducts.push({
                  name,
                  barcode,
                  price,
                });
              }
            }
          });

          console.log(`✅ ${allProducts.length} toplam ürün (şu ana kadar)`);

          // Check if there's a next page
          // BenimPOS uses DataTables pagination - check if we got full 50 rows
          if (rows.length >= 50) {
            // Full page = probably more pages exist
            currentPage++;
            console.log(`➡️  Bir sonraki sayfaya geçiliyor... (Sayfa ${currentPage})`);
            await new Promise(resolve => setTimeout(resolve, 1500)); // Wait before next page
          } else {
            // Less than 50 rows = last page
            hasMorePages = false;
            console.log(`✅ Son sayfa! (Sayfa ${currentPage}) - ${rows.length} ürün bulundu (50'den az)`);
          }
        } else {
          hasMorePages = false;
          console.warn(`⚠️  Sayfa ${currentPage}'de ürün bulunamadı! Tarama tamamlandı.`);
        }
      }

      // 📊 Final summary
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📊 Toplam Ürün: ${allProducts.length} ürün`);
      console.log(`📊 Taranan: ${allProducts.length} / ${allProducts.length} ✅`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      
      return allProducts;

    } catch (error: any) {
      console.error('❌ Scraping hatası:', error.message);
      throw error;
    }
  }

  /**
   * Compare scraped prices with our database
   * 🆕 Artık yeni ürünleri de tespit ediyor!
   */
  async comparePrices(scrapedProducts: ScrapedProduct[]): Promise<{ 
    priceChanges: PriceChangeResult[]; 
    newProducts: NewProductResult[];
  }> {
    console.log('⚖️  Fiyat karşılaştırması yapılıyor...');

    const priceChanges: PriceChangeResult[] = [];
    const newProducts: NewProductResult[] = [];
    const total = scrapedProducts.length;

    for (let i = 0; i < total; i++) {
      const scraped = scrapedProducts[i];
      
      try {
        // 📡 Real-time progress emit
        io.emit('scraping-progress', {
          current: i + 1,
          total,
          productName: scraped.name,
          status: 'scanning'
        });

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

        if (ourProduct) {
          // ✅ Ürün bizde VAR - fiyat kontrolü
          if (Math.abs(ourProduct.price - scraped.price) > 0.01) {
            const difference = scraped.price - ourProduct.price;
            const percentage = (difference / ourProduct.price) * 100;

            // 🚫 DUPLICATE KONTROLÜ: Aynı ürün için zaten PENDING değişiklik var mı?
            const existingChange = await prisma.priceChange.findFirst({
              where: {
                productId: ourProduct.id,
                status: 'PENDING',
                newPrice: scraped.price, // Aynı yeni fiyat
              }
            });

            if (existingChange) {
              console.log(`⏭️  Atlanıyor (zaten pending): ${ourProduct.name}`);
              continue; // Skip duplicate
            }

            priceChanges.push({
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
                scrapedData: { ...scraped.additionalData, isNewProduct: false },
              },
            });
          } else {
            // ℹ️ Fiyat aynı, kaydetme (oldPrice === newPrice)
            console.log(`⏭️  Atlanıyor (fiyat aynı): ${ourProduct.name} - ${ourProduct.price} TL`);
          }
        } else {
          // 🆕 Ürün bizde YOK - yeni ürün!
          newProducts.push({
            name: scraped.name,
            barcode: scraped.barcode,
            price: scraped.price,
            source: 'BENIMPOS',
          });

          // Save as "new product suggestion" (using priceChange table with special flag)
          await prisma.priceChange.create({
            data: {
              productId: 'NEW_PRODUCT', // Dummy ID for new products
              source: 'BENIMPOS',
              oldPrice: 0,
              newPrice: scraped.price,
              difference: scraped.price,
              percentage: 100,
              status: 'PENDING',
              scrapedData: { 
                isNewProduct: true, 
                name: scraped.name,
                barcode: scraped.barcode,
                price: scraped.price,
                ...scraped.additionalData 
              },
            },
          });
        }

        // Small delay to avoid overload
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error: any) {
        console.error(`❌ Ürün karşılaştırma hatası (${scraped.name}):`, error.message);
      }
    }

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 ===== TARAMA SONUÇLARI =====`);
    console.log(`💰 Güncellenmesi Gereken: ${priceChanges.length} ürün`);
    console.log(`🆕 Eklenmesi Gereken: ${newProducts.length} ürün`);
    
    // Detaylı log - Güncellenmesi gerekenler
    if (priceChanges.length > 0) {
      console.log(`\n💰 GÜNCELLENMESI GEREKEN ÜRÜNLER:`);
      priceChanges.forEach((change, i) => {
        const direction = change.difference > 0 ? '⬆️ ARTIŞ' : '⬇️ DÜŞÜŞ';
        console.log(`  ${i + 1}. ${change.productName} (${change.barcode})`);
        console.log(`     Bizim: ${change.oldPrice} TL → Piyasa: ${change.newPrice} TL (${direction}: ${change.percentage.toFixed(2)}%)`);
      });
    }
    
    // Detaylı log - Eklenmesi gerekenler
    if (newProducts.length > 0) {
      console.log(`\n🆕 EKLENMESİ GEREKEN YENİ ÜRÜNLER:`);
      newProducts.forEach((product, i) => {
        console.log(`  ${i + 1}. ${product.name} (${product.barcode || 'Barkod yok'})`);
        console.log(`     Piyasa Fiyatı: ${product.price} TL`);
      });
    }
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    return { priceChanges, newProducts };
  }

  /**
   * 🎭 DEMO MODE - For testing progress bar
   */
  async runDemoScraping(): Promise<{ 
    success: boolean; 
    priceChanges: PriceChangeResult[];
    newProducts: NewProductResult[];
  }> {
    console.log('🎭 DEMO MODE: Simulating scraping...');
    
    // Demo products
    const demoProducts = [
      { name: 'Coca Cola 330ml', barcode: '12345', price: 15.50 },
      { name: 'Fanta 330ml', barcode: '12346', price: 14.00 },
      { name: 'Sprite 330ml', barcode: '12347', price: 14.50 },
      { name: 'Pepsi 330ml', barcode: '12348', price: 15.00 },
      { name: 'Red Bull 250ml', barcode: '12349', price: 35.00 },
      { name: 'Ülker Çikolata', barcode: '12350', price: 8.50 },
      { name: 'Eti Crax', barcode: '12351', price: 6.00 },
      { name: 'Lay\'s Klasik', barcode: '12352', price: 12.00 },
      { name: 'Ruffles Peynir', barcode: '12353', price: 13.50 },
      { name: 'Doritos Acı', barcode: '12354', price: 14.00 },
    ];

    const priceChanges: PriceChangeResult[] = [];
    const newProducts: NewProductResult[] = [];

    for (let i = 0; i < demoProducts.length; i++) {
      const product = demoProducts[i];
      
      // Emit progress
      io.emit('scraping-progress', {
        current: i + 1,
        total: demoProducts.length,
        productName: product.name,
        status: 'scanning'
      });

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 800));

      // Randomly decide if it's a price change or new product
      if (Math.random() > 0.5) {
        // Existing product with price change
        priceChanges.push({
          productId: `demo-${i}`,
          productName: product.name,
          barcode: product.barcode,
          oldPrice: product.price - 2,
          newPrice: product.price,
          difference: 2,
          percentage: (2 / (product.price - 2)) * 100,
        });
      } else {
        // New product
        newProducts.push({
          name: product.name,
          barcode: product.barcode,
          price: product.price,
          source: 'BENIMPOS_DEMO',
        });
      }
    }

    console.log(`🎭 DEMO: ${priceChanges.length} fiyat değişikliği, ${newProducts.length} yeni ürün`);
    return { success: true, priceChanges, newProducts };
  }

  /**
   * Run full scraping process
   * 🆕 Artık yeni ürünleri de tespit ediyor!
   */
  async runScraping(demoMode: boolean = false): Promise<{ 
    success: boolean; 
    priceChanges: PriceChangeResult[];
    newProducts: NewProductResult[];
    error?: string;
  }> {
    const startTime = Date.now();
    console.log('🚀 Fiyat tarama sistemi başlatılıyor...', new Date().toISOString());

    // 🎭 DEMO MODE (BenimPOS login sorunları için geçici)
    if (demoMode) {
      const result = await this.runDemoScraping();
      return result;
    }

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

      // 3. Compare prices + detect new products
      const { priceChanges, newProducts } = await this.comparePrices(scrapedProducts);

      // 4. Cleanup
      await this.cleanup();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      // ✅ DETAYLI ÖZET
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🎉 ===== TARAMA TAMAMLANDI! =====`);
      console.log(`⏱️  Toplam Süre: ${duration} saniye`);
      console.log(`\n📊 Toplam Ürün: ${scrapedProducts.length} ürün`);
      console.log(`📊 Taranan: ${scrapedProducts.length} / ${scrapedProducts.length} ✅`);
      console.log(`\n💰 Güncellenmesi Gereken: ${priceChanges.length} ürün`);
      console.log(`🆕 Eklenmesi Gereken: ${newProducts.length} ürün`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      // Update scraper config - success
      await prisma.scraperConfig.updateMany({
        where: { source: 'BENIMPOS' },
        data: { 
          lastStatus: 'SUCCESS',
          errorMessage: null
        }
      });

      return { success: true, priceChanges, newProducts };

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
      return { success: false, priceChanges: [], newProducts: [], error: error.message };
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

