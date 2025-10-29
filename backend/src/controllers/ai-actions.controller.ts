import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// 🏷️ MARKA VERİTABANI - Akıllı ürün eşleştirme için
const BRAND_PRODUCTS: Record<string, string[]> = {
  'Ülker': [
    'ülker', 'ulker', 'halley', 'ikram', 'albeni', 'bizim', 'metro', 'çizi', 'cizi',
    'finger', 'halley', 'napoliten', 'hanımeller', 'hanimeller', 'biskrem', 'laviva',
    'browni', 'probis', 'çokoprens', 'cokoprens', 'nero', 'hobby'
  ],
  'Eti': [
    'eti', 'karam', 'browni', 'burçak', 'burcak', 'baton', 'sütlü', 'sutlu', 'bitter',
    'puf', 'pötibör', 'potibor', 'lifalif', 'canga', 'cin', 'crax', 'dankek', 'bengü',
    'bengu', 'cicibebe', 'form', 'krispi', 'mini', 'negro'
  ],
  'Coca Cola': [
    'coca cola', 'coca-cola', 'coke', 'fanta', 'sprite', 'cappy', 'fusetea', 'powerade',
    'schweppes', 'burn', 'damla', 'monster'
  ],
  'Pepsi': ['pepsi', 'mirinda', 'yedigün', '7up', 'tropicana', 'lipton ice tea', 'mountain dew'],
  'Nestle': ['nestle', 'nescafe', 'nesquik', 'nes tea', 'maggi', 'milo', 'kitkat'],
  'Ülker Süt': ['ülker süt', 'ulker sut', 'içim', 'icim'],
  'Pınar': ['pınar', 'pinar'],
  'Sek': ['sek', 'sekeroğlu', 'sekeroglu'],
  'Torku': ['torku', 'kent', 'gülpembe', 'gulpembe'],
  'Tadelle': ['tadelle', 'dankek'],
  'Algida': ['algida', 'cornetto', 'magnum', 'maraş', 'carte d\'or'],
  'Ülker Dondurma': ['algida'],
};

// 🤖 AI ACTION: Kategori oluştur ve ürünleri taşı (AKILLI EŞLEŞTİRME)
export const createCategoryAndMoveProducts = async (req: Request, res: Response) => {
  try {
    const { categoryName, productKeyword } = req.body;

    if (!categoryName) {
      return res.status(400).json({ error: 'Kategori adı gerekli' });
    }

    // 1. Kategori zaten var mı kontrol et
    let category = await prisma.category.findFirst({
      where: {
        name: categoryName,
      },
    });

    // 2. Yoksa oluştur
    if (!category) {
      category = await prisma.category.create({
        data: { name: categoryName },
      });
      console.log(`✅ Kategori oluşturuldu: ${categoryName}`);
    } else {
      console.log(`ℹ️  Kategori zaten mevcut: ${categoryName}`);
    }

    // 3. 🧠 AKILLI ÜRÜN EŞLEŞTİRME
    let movedProductsCount = 0;
    if (productKeyword) {
      // Tüm ürünleri al
      const allProducts = await prisma.product.findMany();
      
      // Anahtar kelimeyi normalize et (türkçe karakterler için)
      const normalizedKeyword = productKeyword.toLowerCase().trim();
      
      // Eşleşen marka varsa, o markanın ürün listesini al
      let brandKeywords: string[] = [normalizedKeyword];
      
      for (const [brand, products] of Object.entries(BRAND_PRODUCTS)) {
        if (brand.toLowerCase().includes(normalizedKeyword) || normalizedKeyword.includes(brand.toLowerCase())) {
          brandKeywords = [...brandKeywords, ...products];
          console.log(`🏷️  Marka bulundu: ${brand} (${products.length} ürün tipi)`);
          break;
        }
      }
      
      // Ürünleri akıllıca filtrele
      const productsToMove = allProducts.filter(product => {
        const productName = product.name.toLowerCase();
        
        // Herhangi bir keyword eşleşirse true döndür
        return brandKeywords.some(keyword => {
          const normalizedProductKeyword = keyword.toLowerCase();
          
          // Tam kelime eşleşmesi veya içerme kontrolü
          return (
            productName.includes(normalizedProductKeyword) ||
            productName.split(' ').some(word => word === normalizedProductKeyword)
          );
        });
      });

      // Toplu güncelleme
      if (productsToMove.length > 0) {
        await prisma.product.updateMany({
          where: {
            id: {
              in: productsToMove.map(p => p.id),
            },
          },
          data: {
            categoryId: category.id,
          },
        });
        movedProductsCount = productsToMove.length;
        
        console.log(`✅ ${movedProductsCount} ürün "${categoryName}" kategorisine taşındı`);
        console.log(`📦 Taşınan ürünler: ${productsToMove.map(p => p.name).slice(0, 5).join(', ')}${productsToMove.length > 5 ? '...' : ''}`);
      } else {
        console.log(`⚠️  "${productKeyword}" için eşleşen ürün bulunamadı`);
      }
    }

    res.json({
      success: true,
      message: `Kategori "${categoryName}" ${category.id ? 'oluşturuldu' : 'zaten mevcuttu'}${movedProductsCount > 0 ? ` ve ${movedProductsCount} ürün taşındı` : ''}.`,
      categoryName: category.name,
      movedCount: movedProductsCount,
      category,
    });
  } catch (error: any) {
    console.error('❌ Create category and move products error:', error);
    res.status(500).json({ error: 'İşlem tamamlanamadı: ' + error.message });
  }
};

// 🤖 AI ACTION: Ürün fiyatlarını toplu güncelle
export const bulkUpdateProductPrices = async (req: Request, res: Response) => {
  try {
    const { filter, operation, value } = req.body;

    // filter: { minPrice: 5, maxPrice: 100 } gibi
    // operation: 'increase' | 'decrease' | 'multiply' | 'set'
    // value: sayı (örn: 10 TL artır, %20 çarp)

    if (!operation || value === undefined) {
      return res.status(400).json({ error: 'operation ve value gerekli' });
    }

    // Filtrele
    const products = await prisma.product.findMany({
      where: {
        sellPrice: {
          ...(filter?.minPrice && { gte: filter.minPrice }),
          ...(filter?.maxPrice && { lte: filter.maxPrice }),
        },
        ...(filter?.categoryId && { categoryId: filter.categoryId }),
        ...(filter?.keyword && {
          name: {
            contains: filter.keyword,
          },
        }),
      },
    });

    if (products.length === 0) {
      return res.json({ success: true, message: 'Filtrele uyan ürün bulunamadı', updatedCount: 0 });
    }

    // Yeni fiyatları hesapla
    const updates = products.map(product => {
      let newPrice = product.sellPrice;

      switch (operation) {
        case 'increase':
          newPrice = product.sellPrice + value;
          break;
        case 'decrease':
          newPrice = Math.max(0, product.sellPrice - value);
          break;
        case 'multiply':
          newPrice = product.sellPrice * value;
          break;
        case 'set':
          newPrice = value;
          break;
      }

      return prisma.product.update({
        where: { id: product.id },
        data: { sellPrice: newPrice },
      });
    });

    await Promise.all(updates);

    console.log(`✅ ${products.length} ürünün fiyatı güncellendi (${operation}: ${value})`);

    res.json({
      success: true,
      message: `${products.length} ürünün fiyatı güncellendi`,
      updatedCount: products.length,
    });
  } catch (error: any) {
    console.error('❌ Bulk update prices error:', error);
    res.status(500).json({ error: 'Fiyatlar güncellenemedi: ' + error.message });
  }
};

// 🤖 AI ACTION: Stok toplu güncelle
export const bulkUpdateStocks = async (req: Request, res: Response) => {
  try {
    const { filter, newStock } = req.body;

    if (newStock === undefined) {
      return res.status(400).json({ error: 'newStock değeri gerekli' });
    }

    // Filtrele
    const whereClause: any = {};

    if (filter?.maxStock !== undefined) {
      whereClause.stock = { lte: filter.maxStock };
    }
    if (filter?.minStock !== undefined) {
      if (whereClause.stock) {
        whereClause.stock.gte = filter.minStock;
      } else {
        whereClause.stock = { gte: filter.minStock };
      }
    }
    if (filter?.keyword) {
      whereClause.name = {
        contains: filter.keyword,
      };
    }
    if (filter?.categoryId) {
      whereClause.categoryId = filter.categoryId;
    }

    const result = await prisma.product.updateMany({
      where: whereClause,
      data: { stock: newStock },
    });

    console.log(`✅ ${result.count} ürünün stoğu ${newStock} olarak güncellendi`);

    res.json({
      success: true,
      message: `${result.count} ürünün stoğu ${newStock} olarak güncellendi`,
      updatedCount: result.count,
    });
  } catch (error: any) {
    console.error('❌ Bulk update stocks error:', error);
    res.status(500).json({ error: 'Stoklar güncellenemedi: ' + error.message });
  }
};

// 🤖 AI ACTION: İnaktif ürünleri sil
export const deleteInactiveProducts = async (req: Request, res: Response) => {
  try {
    const result = await prisma.product.deleteMany({
      where: { isActive: false },
    });

    console.log(`✅ ${result.count} inaktif ürün silindi`);

    res.json({
      success: true,
      message: `${result.count} inaktif ürün silindi`,
      deletedCount: result.count,
    });
  } catch (error: any) {
    console.error('❌ Delete inactive products error:', error);
    res.status(500).json({ error: 'İnaktif ürünler silinemedi: ' + error.message });
  }
};

// 🗑️ AI ACTION: Geçersiz barkodlu ürünleri sil (sayı ile başlamayanlar)
export const deleteInvalidBarcodeProducts = async (req: Request, res: Response) => {
  try {
    // Tüm ürünleri al
    const allProducts = await prisma.product.findMany();
    
    // Geçersiz barkodlu ürünleri filtrele (sayı ile başlamayanlar)
    const invalidProducts = allProducts.filter(product => {
      const barcode = product.barcode.trim();
      
      // Eğer barkod boşsa veya sayı ile başlamıyorsa geçersiz
      if (!barcode || barcode.length === 0) return true;
      
      // İlk karakter sayı mı kontrol et
      const firstChar = barcode[0];
      return !/^\d/.test(firstChar); // Sayı ile başlamıyorsa true
    });
    
    if (invalidProducts.length === 0) {
      return res.json({
        success: true,
        message: 'Geçersiz barkodlu ürün bulunamadı',
        deletedCount: 0,
      });
    }
    
    // Geçersiz ürünleri sil
    const result = await prisma.product.deleteMany({
      where: {
        id: {
          in: invalidProducts.map(p => p.id),
        },
      },
    });

    console.log(`✅ ${result.count} geçersiz barkodlu ürün silindi`);
    console.log(`🗑️  Silinen ürünler: ${invalidProducts.map(p => `${p.name} (${p.barcode})`).slice(0, 5).join(', ')}${invalidProducts.length > 5 ? '...' : ''}`);

    res.json({
      success: true,
      message: `${result.count} geçersiz barkodlu ürün silindi`,
      deletedCount: result.count,
      deletedProducts: invalidProducts.map(p => ({ name: p.name, barcode: p.barcode })),
    });
  } catch (error: any) {
    console.error('❌ Delete invalid barcode products error:', error);
    res.status(500).json({ error: 'Geçersiz barkodlu ürünler silinemedi: ' + error.message });
  }
};

// 📊 AI ACTION: Generate chart data
export const generateChartData = async (req: Request, res: Response) => {
  try {
    const { chartType, dataType, period } = req.body;

    let chartData: any = {};

    if (dataType === 'sales' && period) {
      // Son X günün satışları
      const days = parseInt(period.replace('days', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const sales = await prisma.sale.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: 'asc' },
        select: {
          total: true,
          createdAt: true,
        },
      });

      // Group by date
      const salesByDate: any = {};
      sales.forEach(sale => {
        const date = sale.createdAt.toISOString().split('T')[0];
        if (!salesByDate[date]) {
          salesByDate[date] = 0;
        }
        salesByDate[date] += sale.total;
      });

      chartData = {
        type: chartType || 'line',
        labels: Object.keys(salesByDate),
        datasets: [{
          label: 'Satış (TL)',
          data: Object.values(salesByDate),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        }],
      };
    }

    res.json({
      success: true,
      chartData,
    });
  } catch (error: any) {
    console.error('❌ Generate chart data error:', error);
    res.status(500).json({ error: 'Grafik oluşturulamadı: ' + error.message });
  }
};

// 🔍 AI ACTION: Doğal dil sorgusu (karmaşık sorgular için)
export const naturalQuery = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Sorgu metni gerekli' });
    }

    console.log('🔍 Natural Query:', query);

    let results: any[] = [];
    let resultType = 'unknown';

    // 🏷️ Barkodu harfle başlayan ürünler
    if (query.toLowerCase().includes('barkod') && (query.toLowerCase().includes('harf') || query.toLowerCase().includes('geçersiz'))) {
      const allProducts = await prisma.product.findMany({
        include: {
          category: { select: { name: true } },
        },
      });
      
      console.log(`📊 Toplam ürün sayısı: ${allProducts.length}`);
      
      // Barkodu sayı ile başlamayanları filtrele
      results = allProducts.filter(product => {
        const barcode = product.barcode.trim();
        if (!barcode || barcode.length === 0) return true;
        const firstChar = barcode[0];
        const isInvalid = !/^\d/.test(firstChar); // Sayı ile başlamıyorsa true
        
        if (isInvalid) {
          console.log(`❌ Geçersiz barkod: ${product.name} → ${barcode}`);
        }
        
        return isInvalid;
      }).slice(0, 30); // İlk 30 ürün
      
      console.log(`🔍 Bulunan geçersiz ürün sayısı: ${results.length}`);
      
      resultType = 'products_with_barcodes';
    }
    // 💰 Fiyat sorguları
    else if (
      query.toLowerCase().includes('fiyat') || 
      query.toLowerCase().includes('tl') || 
      query.toLowerCase().includes('absürt') || 
      query.toLowerCase().includes('pahalı') ||
      query.toLowerCase().includes('ucuz')
    ) {
      let priceFilter: any = {};
      
      // "10000'in üzerinde", "5000'den fazla" gibi sorguları yakala
      const priceMatch = query.match(/(\d+)[^\d]*(?:üzer|fazla|yüksek|pahalı)/i);
      if (priceMatch) {
        const price = parseInt(priceMatch[1]);
        priceFilter = { sellPrice: { gte: price } };
      }
      // "5000'in altında", "1000'den az" gibi sorguları yakala
      else if (query.match(/(\d+)[^\d]*(?:alt|az|ucuz)/i)) {
        const priceMatch2 = query.match(/(\d+)[^\d]*(?:alt|az|ucuz)/i);
        if (priceMatch2) {
          const price = parseInt(priceMatch2[1]);
          priceFilter = { sellPrice: { lte: price } };
        }
      }
      // "Absürt" veya "yüksek fiyat" gibi genel sorguları yakala
      else if (query.toLowerCase().includes('absürt') || query.toLowerCase().includes('yüksek')) {
        priceFilter = { sellPrice: { gte: 500 } }; // 500 TL'den yüksek
      }
      // "En ucuz" sorguları
      else if (query.toLowerCase().includes('en ucuz')) {
        priceFilter = {}; // Tümünü al, en ucuzları sırala
      }
      
      const orderBy: any = query.toLowerCase().includes('ucuz') 
        ? { sellPrice: 'asc' } 
        : { sellPrice: 'desc' };
      
      const limit = parseInt(query.match(/(\d+)\s*(?:ürün|adet)/i)?.[1] || '10');
      
      results = await prisma.product.findMany({
        where: priceFilter,
        include: {
          category: { select: { name: true } },
        },
        orderBy,
        take: Math.min(limit, 30), // Max 30
      });
      resultType = 'products';
    }
    // 📦 Satılmayan ürünler
    else if (query.toLowerCase().includes('satılmayan') || query.toLowerCase().includes('satış gerçekleşmemiş')) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Son 30 günde satılan ürünlerin ID'lerini bul
      const soldProductIds = await prisma.saleItem.findMany({
        where: {
          sale: {
            createdAt: { gte: thirtyDaysAgo },
          },
        },
        select: { productId: true },
        distinct: ['productId'],
      });

      const soldIds = soldProductIds.map(item => item.productId);

      // Satılmayan ürünleri getir
      results = await prisma.product.findMany({
        where: {
          id: { notIn: soldIds },
          ...(query.toLowerCase().includes('1000') ? { sellPrice: { gte: 1000 } } : {}),
        },
        include: {
          category: { select: { name: true } },
        },
        orderBy: { sellPrice: 'desc' },
        take: 10,
      });
      resultType = 'products';
    }
    // 💸 Borçlu müşteriler
    else if (query.toLowerCase().includes('borç') && query.toLowerCase().includes('müşteri')) {
      const debtThreshold = parseInt(query.match(/\d+/)?.[0] || '0');
      
      results = await prisma.customer.findMany({
        where: {
          debt: { gte: debtThreshold },
        },
        orderBy: { debt: 'desc' },
        take: 10,
      });
      resultType = 'customers';
    }
    // 📊 En çok satan ürünler
    else if (query.toLowerCase().includes('en çok satan')) {
      const topProducts = await prisma.saleItem.groupBy({
        by: ['productId'],
        _sum: {
          quantity: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 10,
      });

      const productDetails = await Promise.all(
        topProducts.map(async (item) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            include: { category: { select: { name: true } } },
          });
          return {
            ...product,
            totalSold: item._sum.quantity,
          };
        })
      );

      results = productDetails;
      resultType = 'products_with_sales';
    }
    // 🔍 Genel arama (ürün adı)
    else {
      results = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
          ],
        },
        include: {
          category: { select: { name: true } },
        },
        take: 10,
      });
      resultType = 'products';
    }

    res.json({
      success: true,
      query,
      resultType,
      resultCount: results.length,
      results,
    });
  } catch (error: any) {
    console.error('❌ Natural query error:', error);
    res.status(500).json({ error: 'Sorgu çalıştırılamadı: ' + error.message });
  }
};

// 🤖 AI ACTION: Ürün oluştur
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, barcode, sellPrice, buyPrice, stock, minStock, unit, categoryName, description } = req.body;

    if (!name || !sellPrice) {
      return res.status(400).json({ error: 'Ürün adı ve satış fiyatı gerekli' });
    }

    // Kategori varsa bul veya oluştur
    let category;
    if (categoryName) {
      category = await prisma.category.findFirst({
        where: { name: categoryName.trim() },
      });

      if (!category) {
        category = await prisma.category.create({
          data: { name: categoryName.trim() },
        });
      }
    }

    // Barkod kontrolü - eğer yoksa otomatik oluştur
    const finalBarcode = barcode || `AUTO-${Date.now()}`;

    // SKU oluştur
    const sku = `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        barcode: finalBarcode,
        sku,
        sellPrice: parseFloat(sellPrice),
        buyPrice: buyPrice ? parseFloat(buyPrice) : 0,
        stock: stock ? parseInt(stock) : 0,
        minStock: minStock ? parseInt(minStock) : 5,
        unit: unit || 'ADET',
        categoryId: category?.id,
        description: description || '',
        isActive: true,
      },
      include: {
        category: { select: { name: true } },
      },
    });

    res.json({
      success: true,
      message: `${product.name} başarıyla oluşturuldu`,
      product,
    });
  } catch (error: any) {
    console.error('❌ Create product error:', error);
    res.status(500).json({ error: 'Ürün oluşturulamadı: ' + error.message });
  }
};

// 🤖 AI ACTION: Ürün sil
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { productId, productName, barcode } = req.body;

    let product;

    if (productId) {
      product = await prisma.product.findUnique({ where: { id: productId } });
    } else if (barcode) {
      product = await prisma.product.findUnique({ where: { barcode } });
    } else if (productName) {
      product = await prisma.product.findFirst({
        where: { name: { contains: productName } },
      });
    }

    if (!product) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    await prisma.product.delete({ where: { id: product.id } });

    res.json({
      success: true,
      message: `${product.name} başarıyla silindi`,
      deletedProduct: product.name,
    });
  } catch (error: any) {
    console.error('❌ Delete product error:', error);
    res.status(500).json({ error: 'Ürün silinemedi: ' + error.message });
  }
};

// 🤖 AI ACTION: Kategori sil
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { categoryName, categoryId } = req.body;

    let category;

    if (categoryId) {
      category = await prisma.category.findUnique({ where: { id: categoryId } });
    } else if (categoryName) {
      category = await prisma.category.findFirst({
        where: { name: categoryName },
      });
    }

    if (!category) {
      return res.status(404).json({ error: 'Kategori bulunamadı' });
    }

    // Kategoriye ait ürünleri kategorisiz yap
    await prisma.product.updateMany({
      where: { categoryId: category.id },
      data: { categoryId: null },
    });

    await prisma.category.delete({ where: { id: category.id } });

    res.json({
      success: true,
      message: `${category.name} kategorisi silindi`,
      deletedCategory: category.name,
    });
  } catch (error: any) {
    console.error('❌ Delete category error:', error);
    res.status(500).json({ error: 'Kategori silinemedi: ' + error.message });
  }
};

// 🤖 AI ACTION: Müşteri oluştur
export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { name, phone, email, address, debt } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Müşteri adı gerekli' });
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: phone || '',
        email: email || '',
        address: address || '',
        debt: debt ? parseFloat(debt) : 0,
        loyaltyPoints: 0,
      },
    });

    res.json({
      success: true,
      message: `${customer.name} başarıyla oluşturuldu`,
      customer,
    });
  } catch (error: any) {
    console.error('❌ Create customer error:', error);
    res.status(500).json({ error: 'Müşteri oluşturulamadı: ' + error.message });
  }
};

// 🗑️ AI ACTION: Absürt fiyatlı ürünleri sil
export const deleteAbsurdPricedProducts = async (req: Request, res: Response) => {
  try {
    // Fiyatı 1 milyon TL'den fazla olan ürünleri bul ve sil
    const absurdProducts = await prisma.product.findMany({
      where: {
        sellPrice: { gte: 1000000 }, // 1 milyon TL ve üzeri
      },
    });

    if (absurdProducts.length === 0) {
      return res.json({
        success: true,
        message: 'Absürt fiyatlı ürün bulunamadı',
        deletedCount: 0,
        deletedProducts: [],
      });
    }

    // Ürünleri sil
    await prisma.product.deleteMany({
      where: {
        sellPrice: { gte: 1000000 },
      },
    });

    res.json({
      success: true,
      message: `${absurdProducts.length} absürt fiyatlı ürün silindi`,
      deletedCount: absurdProducts.length,
      deletedProducts: absurdProducts.map(p => ({
        name: p.name,
        price: p.sellPrice,
      })),
    });
  } catch (error: any) {
    console.error('❌ Delete absurd priced products error:', error);
    res.status(500).json({ error: 'Ürünler silinemedi: ' + error.message });
  }
};

