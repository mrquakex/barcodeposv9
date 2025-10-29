import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { generateEAN13 } from '../utils/barcode';
import * as XLSX from 'xlsx';

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { search, categoryId, isActive } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { barcode: { contains: search as string } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId as string;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Ürünler getirilemedi' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Ürün getirilemedi' });
  }
};

export const getProductByBarcode = async (req: Request, res: Response) => {
  try {
    let { barcode } = req.params;
    
    // 🔥 BARKOD NORMALİZE ET (boşlukları kaldır, büyük harf yap)
    const normalizedBarcode = barcode.trim().replace(/\s+/g, '').toUpperCase();

    // İLK DENEME: Tam eşleşme (exact match)
    let product = await prisma.product.findUnique({
      where: { barcode },
      include: {
        category: true,
      },
    });

    // İKİNCİ DENEME: Normalize edilmiş ile tam eşleşme
    if (!product) {
      product = await prisma.product.findUnique({
        where: { barcode: normalizedBarcode },
        include: {
          category: true,
        },
      });
    }

    // ÜÇÜNCÜ DENEME: CONTAINS search (içerir)
    if (!product) {
      const products = await prisma.product.findMany({
        where: {
          barcode: {
            contains: normalizedBarcode,
          },
        },
        include: {
          category: true,
        },
        take: 1,
      });
      
      if (products.length > 0) {
        product = products[0];
      }
    }

    if (!product) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    res.json(product); // 🔥 Direkt product objesini dön
  } catch (error) {
    console.error('Get product by barcode error:', error);
    res.status(500).json({ error: 'Ürün getirilemedi' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { barcode, name, description, sellPrice, buyPrice, stock, unit, taxRate, minStock, categoryId, imageUrl } = req.body;

    // Barkod kontrolü
    let finalBarcode = barcode;
    if (!finalBarcode) {
      finalBarcode = generateEAN13();
    }

    // Barkod benzersiz mi kontrol et
    const existingProduct = await prisma.product.findUnique({
      where: { barcode: finalBarcode },
    });

    if (existingProduct) {
      return res.status(400).json({ error: 'Bu barkod zaten kullanılıyor' });
    }

    const product = await prisma.product.create({
      data: {
        barcode: finalBarcode,
        name,
        description,
        sellPrice: parseFloat(sellPrice),
        buyPrice: buyPrice ? parseFloat(buyPrice) : 0,
        stock: stock ? parseInt(stock) : 0,
        unit: unit || 'Adet',
        taxRate: taxRate ? parseFloat(taxRate) : 18,
        minStock: minStock ? parseInt(minStock) : 5,
        ...(categoryId && categoryId !== '' && { categoryId }),
        imageUrl,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json({ message: 'Ürün başarıyla oluşturuldu', product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Ürün oluşturulamadı' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, sellPrice, buyPrice, stock, unit, taxRate, minStock, categoryId, imageUrl, isActive, isFavorite } = req.body;

    // Update data objesini dinamik olarak oluştur
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (sellPrice !== undefined) updateData.sellPrice = parseFloat(sellPrice);
    if (buyPrice !== undefined) updateData.buyPrice = parseFloat(buyPrice);
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (unit !== undefined) updateData.unit = unit;
    if (taxRate !== undefined) updateData.taxRate = parseFloat(taxRate);
    if (minStock !== undefined) updateData.minStock = parseInt(minStock);
    if (categoryId !== undefined) {
      // Boş string ise null yap
      updateData.categoryId = categoryId === '' ? null : categoryId;
    }
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });

    res.json({ message: 'Ürün başarıyla güncellendi', product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Ürün güncellenemedi' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if product has ANY related records
    const saleItems = await prisma.saleItem.count({ where: { productId: id } });
    const stockCountItems = await prisma.stockCountItem.count({ where: { productId: id } });
    const stockMovements = await prisma.stockMovement.count({ where: { productId: id } });
    const productVariants = await prisma.productVariant.count({ where: { productId: id } });
    const purchaseOrderItems = await prisma.purchaseOrderItem.count({ where: { productId: id } });
    
    const hasRelations = saleItems > 0 || stockCountItems > 0 || stockMovements > 0 || 
                        productVariants > 0 || purchaseOrderItems > 0;
    
    if (hasRelations) {
      // Soft delete: Just deactivate the product instead of deleting
      await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      
      res.json({ 
        message: 'Ürün devre dışı bırakıldı (ilişkili kayıtlar olduğu için silinemez)', 
        softDelete: true 
      });
    } else {
      // No related records, safe to delete
      await prisma.product.delete({
        where: { id },
      });
      
      res.json({ message: 'Ürün başarıyla silindi' });
    }
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Ürün silinemedi' });
  }
};

export const bulkDeleteProducts = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Silinecek ürün ID\'leri gerekli' });
    }

    const result = await prisma.product.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    res.json({ 
      message: `${result.count} ürün başarıyla silindi`,
      count: result.count,
    });
  } catch (error) {
    console.error('Bulk delete products error:', error);
    res.status(500).json({ error: 'Ürünler silinemedi' });
  }
};

export const getLowStockProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        stock: {
          lte: prisma.product.fields.minStock,
        },
        isActive: true,
      },
      include: {
        category: true,
      },
      orderBy: {
        stock: 'asc',
      },
    });

    res.json({ products });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({ error: 'Düşük stoklu ürünler getirilemedi' });
  }
};

// Bulk Import/Upsert - Toplu ürün ekleme/güncelleme (HIZLI!)
export const bulkUpsertProducts = async (req: Request, res: Response) => {
  try {
    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Ürün listesi gerekli' });
    }

    let addedCount = 0;
    let updatedCount = 0;
    const errors: any[] = [];

    // Transaction OLMADAN (daha hızlı ve timeout yok!)
    // Her ürünü paralel olarak işle (Promise.all ile)
    const batchPromises = products.map(async (productData) => {
      try {
        // Barkoda göre ürün ara
        const existingProduct = productData.barcode
          ? await prisma.product.findFirst({
              where: { barcode: productData.barcode },
            })
          : null;

        if (existingProduct) {
          // GÜNCELLE
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              name: productData.name,
              sellPrice: productData.sellPrice || productData.price,
              buyPrice: productData.buyPrice || productData.cost,
              stock: productData.stock,
              unit: productData.unit || 'ADET',
              taxRate: productData.taxRate || 18,
              minStock: productData.minStock || 5,
              description: productData.description,
              ...(productData.categoryId && { categoryId: productData.categoryId }),
            },
          });
          return { type: 'updated' };
        } else {
          // YENİ EKLE
          await prisma.product.create({
            data: {
              barcode: productData.barcode || generateEAN13(),
              name: productData.name,
              sellPrice: productData.sellPrice || productData.price,
              buyPrice: productData.buyPrice || productData.cost || 0,
              stock: productData.stock || 0,
              unit: productData.unit || 'ADET',
              taxRate: productData.taxRate || 18,
              minStock: productData.minStock || 5,
              description: productData.description || '',
              isActive: true,
              ...(productData.categoryId && { categoryId: productData.categoryId }),
            },
          });
          return { type: 'added' };
        }
      } catch (itemError: any) {
        errors.push({
          product: productData.name,
          error: itemError.message,
        });
        return { type: 'error' };
      }
    });

    // Tüm işlemleri paralel çalıştır
    const results = await Promise.all(batchPromises);
    
    // Sonuçları say
    results.forEach(result => {
      if (result.type === 'added') addedCount++;
      if (result.type === 'updated') updatedCount++;
    });

    res.json({
      success: true,
      message: `${addedCount} ürün eklendi, ${updatedCount} ürün güncellendi`,
      added: addedCount,
      updated: updatedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Bulk upsert products error:', error);
    res.status(500).json({ error: 'Toplu ürün işlemi başarısız: ' + error.message });
  }
};

// 🌟 FAVORİ ÜRÜN TOGGLE
export const toggleFavorite = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        isFavorite: !product.isFavorite,
      },
      include: {
        category: true,
      },
    });

    res.json({
      success: true,
      isFavorite: updatedProduct.isFavorite,
      message: updatedProduct.isFavorite ? '❤️ Favorilere eklendi!' : '💔 Favorilerden çıkarıldı',
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Favori durumu değiştirilemedi' });
  }
};

// 🌟 FAVORİ ÜRÜNLERİ GETİR
export const getFavoriteProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isFavorite: true,
        isActive: true, // Sadece aktif favoriler
      },
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc', // Alfabetik sıralama
      },
    });

    res.json({ 
      products,
      count: products.length 
    });
  } catch (error) {
    console.error('Get favorite products error:', error);
    res.status(500).json({ error: 'Favori ürünler getirilemedi' });
  }
};

// Excel/CSV ile Toplu Ürün İçe Aktarma
export const bulkImportProducts = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Dosya yüklenmedi' });
    }

    // Excel dosyasını parse et
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // JSON'a çevir (header: 1 ile array olarak al - başlık olup olmadığına bakmaksızın)
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (rawData.length === 0) {
      return res.status(400).json({ error: 'Excel dosyası boş' });
    }

    // İlk satır başlık mı yoksa data mı kontrol et
    const firstRow: any = rawData[0];
    const hasHeaders = 
      typeof firstRow[0] === 'string' && 
      (firstRow[0].toLowerCase().includes('barkod') || 
       firstRow[1].toLowerCase().includes('ürün') ||
       firstRow[1].toLowerCase().includes('ad'));

    // Başlık varsa 2. satırdan başla, yoksa 1. satırdan
    const startRow = hasHeaders ? 1 : 0;

    // Başarılı ve başarısız kayıtları takip et
    const results = {
      success: 0,
      updated: 0,
      created: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Her satırı işle
    for (let i = startRow; i < rawData.length; i++) {
      const row: any = rawData[i];

      // Boş satırları atla
      if (!row || row.every((cell: any) => !cell)) {
        continue;
      }

      try {
        // Excel sütunları - İNDEKS BAZLI (BenimPOS formatı)
        // A: Ürün Barkodu, B: Ürün Adı, C: Adet, D: Birim, E: Fiyat 1, 
        // F: KDV, G: Alış Fiyatı, H: Üst Grup, I: Ürün Grubu, 
        // J: Fiyat 2, K: Stok Kodu, L: Ürün Detayı, M: Hızlı Grup, 
        // N: Sıra, O: Kritik Stok
        
        let barcode = String(row[0] || '').trim();
        const name = String(row[1] || '').trim();
        const stock = parseInt(String(row[2] || '0')) || 0;
        const unit = String(row[3] || 'ADET').trim();
        const sellPrice = parseFloat(String(row[4] || '0')) || 0;
        const taxRate = parseFloat(String(row[5] || '18')) || 18;
        const buyPrice = parseFloat(String(row[6] || '0')) || 0;
        const categoryName = String(row[8] || '').trim(); // I sütunu (Ürün Grubu)
        const sku = String(row[10] || '').trim(); // K sütunu
        const description = String(row[11] || '').trim(); // L sütunu
        const minStock = parseInt(String(row[14] || '5')) || 5; // O sütunu

        // 🧹 BARKOD TEMİZLİĞİ - Başındaki/sonundaki gereksiz karakterleri kaldır
        if (barcode && typeof barcode === 'string') {
          barcode = barcode
            .trim() // Boşlukları kaldır
            .replace(/^[.,'"´`\-\s]+/, '') // Başındaki: . , ' " ´ ` - boşluk
            .replace(/[.,'"´`\-\s]+$/, ''); // Sonundaki: . , ' " ´ ` - boşluk
        }

        // Validasyon
        const rowNumber = hasHeaders ? i + 1 : i + 1; // Excel satır numarası (1-based)
        
        if (!name || name === '') {
          results.errors.push(`Satır ${rowNumber}: Ürün adı boş olamaz (B sütunu)`);
          results.failed++;
          continue;
        }

        if (sellPrice <= 0) {
          results.errors.push(`Satır ${rowNumber}: Satış fiyatı 0'dan büyük olmalı (E sütunu)`);
          results.failed++;
          continue;
        }

        // Kategori var mı kontrol et, yoksa oluştur
        let category;
        if (categoryName && categoryName.trim() !== '') {
          category = await prisma.category.findFirst({
            where: { name: categoryName.trim() },
          });

          if (!category) {
            category = await prisma.category.create({
              data: { name: categoryName.trim() },
            });
          }
        }

        // Barkod yoksa otomatik oluştur
        let finalBarcode = barcode && barcode.trim() !== '' ? barcode.trim() : generateEAN13();
        
        // SKU yoksa otomatik oluştur
        let finalSku = sku && sku.trim() !== '' ? sku.trim() : `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Barkod zaten var mı kontrol et
        const existingProduct = await prisma.product.findUnique({
          where: { barcode: finalBarcode },
        });

        if (existingProduct) {
          // Varsa güncelle
          await prisma.product.update({
            where: { barcode: finalBarcode },
            data: {
              name: name.trim(),
              categoryId: category?.id,
              buyPrice,
              sellPrice,
              stock,
              minStock,
              unit,
              taxRate,
              description: description || '',
            },
          });
          results.updated++;
        } else {
          // Yoksa yeni oluştur
          await prisma.product.create({
            data: {
              barcode: finalBarcode,
              sku: finalSku,
              name: name.trim(),
              categoryId: category?.id,
              buyPrice,
              sellPrice,
              stock,
              minStock,
              unit,
              taxRate,
              description: description || '',
              isActive: true,
            },
          });
          results.created++;
        }

        results.success++;
      } catch (error: any) {
        const rowNumber = hasHeaders ? i + 1 : i + 1;
        results.errors.push(`Satır ${rowNumber}: ${error.message}`);
        results.failed++;
      }
    }

    res.json({
      message: 'Toplu aktarım tamamlandı',
      results,
    });
  } catch (error: any) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: error.message || 'Toplu aktarım sırasında hata oluştu' });
  }
};

// 🔧 TEK SEFERLİK: Tüm stokları 50'ye çek
export const resetAllStocksTo50 = async (req: Request, res: Response) => {
  try {
    const result = await prisma.product.updateMany({
      data: {
        stock: 50,
      },
    });

    res.json({
      success: true,
      message: `${result.count} ürünün stoğu 50'ye güncellendi`,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error('Reset stocks error:', error);
    res.status(500).json({ error: 'Stoklar güncellenemedi' });
  }
};
