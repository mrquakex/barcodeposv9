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
        { name: { contains: search as string, mode: 'insensitive' } },
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
    
    console.log('📸 Aranan barkod (raw):', barcode);
    console.log('📸 Aranan barkod (normalized):', normalizedBarcode);

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

    // ÜÇÜNCÜ DENEME: Case-insensitive LIKE search (büyük/küçük harf fark etmez)
    if (!product) {
      const products = await prisma.product.findMany({
        where: {
          barcode: {
            equals: normalizedBarcode,
            mode: 'insensitive', // 🔥 Büyük/küçük harf fark etmez
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

    // DÖRDÜNCÜ DENEME: CONTAINS search (içerir)
    if (!product) {
      const products = await prisma.product.findMany({
        where: {
          barcode: {
            contains: normalizedBarcode,
            mode: 'insensitive',
          },
        },
        include: {
          category: true,
        },
        take: 1,
      });
      
      if (products.length > 0) {
        product = products[0];
        console.log('⚠️ CONTAINS ile bulundu:', product.barcode);
      }
    }

    if (!product) {
      console.log('❌ Ürün bulunamadı. Aranan:', normalizedBarcode);
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    console.log('✅ Ürün bulundu:', product.name, '(', product.barcode, ')');
    res.json({ product });
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

    await prisma.product.delete({
      where: { id },
    });

    res.json({ message: 'Ürün başarıyla silindi' });
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
    
    // JSON'a çevir
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    if (rawData.length === 0) {
      return res.status(400).json({ error: 'Excel dosyası boş' });
    }

    // Başarılı ve başarısız kayıtları takip et
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Her satırı işle
    for (let i = 0; i < rawData.length; i++) {
      const row: any = rawData[i];

      try {
        // Excel sütun isimleri (case-insensitive)
        const barcode = row['Barkod'] || row['barkod'] || row['BARKOD'] || row['Barcode'] || '';
        const name = row['Ürün Adı'] || row['ürün adı'] || row['ÜRÜN ADI'] || row['Name'] || row['name'] || '';
        const categoryName = row['Kategori'] || row['kategori'] || row['KATEGORI'] || row['Category'] || '';
        const buyPrice = parseFloat(row['Alış Fiyatı'] || row['alış fiyatı'] || row['ALIŞ FİYATI'] || row['Buy Price'] || row['Cost'] || '0');
        const sellPrice = parseFloat(row['Satış Fiyatı'] || row['satış fiyatı'] || row['SATIŞ FİYATI'] || row['Sell Price'] || row['Price'] || '0');
        const stock = parseInt(row['Stok'] || row['stok'] || row['STOK'] || row['Stock'] || row['Quantity'] || '0');
        const taxRate = parseFloat(row['KDV'] || row['kdv'] || row['KDV Oranı'] || row['Tax'] || row['VAT'] || '18');

        // Validasyon
        if (!name || name.trim() === '') {
          results.errors.push(`Satır ${i + 2}: Ürün adı boş olamaz`);
          results.failed++;
          continue;
        }

        if (sellPrice <= 0) {
          results.errors.push(`Satır ${i + 2}: Satış fiyatı 0'dan büyük olmalı`);
          results.failed++;
          continue;
        }

        // Kategori var mı kontrol et, yoksa oluştur
        let category;
        if (categoryName && categoryName.trim() !== '') {
          category = await prisma.category.findFirst({
            where: { name: { equals: categoryName.trim(), mode: 'insensitive' } },
          });

          if (!category) {
            category = await prisma.category.create({
              data: { name: categoryName.trim() },
            });
          }
        }

        // Barkod yoksa otomatik oluştur
        let finalBarcode = barcode && barcode.trim() !== '' ? barcode.trim() : generateEAN13();

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
              taxRate,
            },
          });
        } else {
          // Yoksa yeni oluştur
          await prisma.product.create({
            data: {
              barcode: finalBarcode,
              sku: `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: name.trim(),
              categoryId: category?.id,
              buyPrice,
              sellPrice,
              stock,
              taxRate,
              isActive: true,
            },
          });
        }

        results.success++;
      } catch (error: any) {
        results.errors.push(`Satır ${i + 2}: ${error.message}`);
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


