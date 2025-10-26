import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// 🤖 AI ACTION: Kategori oluştur ve ürünleri taşı
export const createCategoryAndMoveProducts = async (req: Request, res: Response) => {
  try {
    const { categoryName, productKeyword } = req.body;

    if (!categoryName) {
      return res.status(400).json({ error: 'Kategori adı gerekli' });
    }

    // 1. Kategori zaten var mı kontrol et
    let category = await prisma.category.findFirst({
      where: {
        name: {
          equals: categoryName,
          mode: 'insensitive',
        },
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

    // 3. Eğer productKeyword varsa, bu keyword'e uyan ürünleri taşı
    let movedProductsCount = 0;
    if (productKeyword) {
      const productsToMove = await prisma.product.findMany({
        where: {
          name: {
            contains: productKeyword,
            mode: 'insensitive',
          },
        },
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
      }
    }

    res.json({
      success: true,
      message: `Kategori "${categoryName}" ${category.id ? 'oluşturuldu' : 'zaten mevcuttu'}${movedProductsCount > 0 ? ` ve ${movedProductsCount} ürün taşındı` : ''}.`,
      category,
      movedProductsCount,
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
        price: {
          ...(filter?.minPrice && { gte: filter.minPrice }),
          ...(filter?.maxPrice && { lte: filter.maxPrice }),
        },
        ...(filter?.categoryId && { categoryId: filter.categoryId }),
        ...(filter?.keyword && {
          name: {
            contains: filter.keyword,
            mode: 'insensitive',
          },
        }),
      },
    });

    if (products.length === 0) {
      return res.json({ success: true, message: 'Filtrele uyan ürün bulunamadı', updatedCount: 0 });
    }

    // Yeni fiyatları hesapla
    const updates = products.map(product => {
      let newPrice = product.price;

      switch (operation) {
        case 'increase':
          newPrice = product.price + value;
          break;
        case 'decrease':
          newPrice = Math.max(0, product.price - value);
          break;
        case 'multiply':
          newPrice = product.price * value;
          break;
        case 'set':
          newPrice = value;
          break;
      }

      return prisma.product.update({
        where: { id: product.id },
        data: { price: newPrice },
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
        mode: 'insensitive',
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

