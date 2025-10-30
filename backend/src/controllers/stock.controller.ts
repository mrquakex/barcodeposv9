import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sendEmail } from '../services/email.service';

// 📊 Dashboard istatistikleri
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Toplam ürün sayısı
    const totalProducts = await prisma.product.count();

    // Toplam stok değeri
    const products = await prisma.product.findMany({
      select: { stock: true, buyPrice: true }
    });
    const totalValue = products.reduce((sum, p) => sum + (p.stock * p.buyPrice), 0);

    // Kritik stok sayısı (min stok altında)
    // Prisma ile doğru kullanım için tüm ürünleri çekip filtrelemek zorundayız
    const allProductsForCriticalCount = await prisma.product.findMany({
      select: { stock: true, minStock: true }
    });
    const criticalStock = allProductsForCriticalCount.filter(p => 
      p.stock <= p.minStock || (p.stock <= 10 && p.minStock === 0)
    ).length;

    // Son 7 günlük hareketler
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMovements = await prisma.stockMovement.groupBy({
      by: ['type'],
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      _sum: {
        quantity: true
      }
    });

    const inCount = recentMovements.find(m => m.type === 'IN')?._sum.quantity || 0;
    const outCount = recentMovements.find(m => m.type === 'OUT')?._sum.quantity || 0;

    // Ortalama stok devir hızı (gün)
    const avgTurnover = 45; // Hesaplama karmaşık, şimdilik sabit değer

    // Devam eden sayım sayısı
    const activeStockCounts = await prisma.stockCount.count({
      where: {
        status: 'IN_PROGRESS'
      }
    });

    res.json({
      totalProducts,
      totalValue,
      criticalStock,
      last7Days: {
        inCount,
        outCount
      },
      avgTurnover,
      activeStockCounts
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Dashboard verileri alınamadı' });
  }
};

// ⚠️ Stok uyarıları
export const getStockAlerts = async (req: Request, res: Response) => {
  try {
    // Kritik stok (min stok altında)
    const allProductsForCritical = await prisma.product.findMany({
      include: {
        category: true
      }
    });
    
    const criticalStockProducts = allProductsForCritical.filter(p => 
      p.stock <= p.minStock || (p.stock <= 10 && p.minStock === 0)
    ).sort((a, b) => a.stock - b.stock);

    // Fazla stok (max stok üstünde, eğer max belirtilmişse)
    const allProducts = await prisma.product.findMany({
      where: {
        maxStock: { not: null }
      },
      include: {
        category: true
      }
    });
    
    const overStockProducts = allProducts.filter(p => 
      p.maxStock !== null && p.stock >= p.maxStock
    );

    // Hareketsiz stoklar (son 60 günde hareket olmayan)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentMovementProductIds = await prisma.stockMovement.findMany({
      where: {
        createdAt: {
          gte: sixtyDaysAgo
        }
      },
      select: {
        productId: true
      },
      distinct: ['productId']
    });

    const movedProductIds = recentMovementProductIds.map(m => m.productId);

    const inactiveProducts = await prisma.product.findMany({
      where: {
        id: {
          notIn: movedProductIds
        },
        stock: {
          gt: 0
        }
      },
      include: {
        category: true
      },
      take: 50
    });

    res.json({
      critical: criticalStockProducts,
      overStock: overStockProducts,
      inactive: inactiveProducts
    });
  } catch (error) {
    console.error('Stock alerts error:', error);
    res.status(500).json({ error: 'Stok uyarıları alınamadı' });
  }
};

// 📊 ABC Analizi
export const getABCAnalysis = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        barcode: true,
        stock: true,
        buyPrice: true,
        sellPrice: true,
        category: {
          select: { name: true }
        }
      }
    });

    // Her ürünün değerini hesapla
    const productsWithValue = products.map(p => ({
      ...p,
      totalValue: p.stock * p.buyPrice
    }));

    // Toplam değeri hesapla
    const totalValue = productsWithValue.reduce((sum, p) => sum + p.totalValue, 0);

    // Değere göre sırala
    productsWithValue.sort((a, b) => b.totalValue - a.totalValue);

    // Kümülatif yüzde hesapla
    let cumulativeValue = 0;
    const categorizedProducts = productsWithValue.map(p => {
      cumulativeValue += p.totalValue;
      const cumulativePercent = (cumulativeValue / totalValue) * 100;

      let category = 'C';
      if (cumulativePercent <= 80) category = 'A';
      else if (cumulativePercent <= 95) category = 'B';

      return { ...p, category, cumulativePercent };
    });

    // Kategori bazlı özet
    const summary = {
      A: categorizedProducts.filter(p => p.category === 'A'),
      B: categorizedProducts.filter(p => p.category === 'B'),
      C: categorizedProducts.filter(p => p.category === 'C')
    };

    res.json({
      products: categorizedProducts,
      summary: {
        A: {
          count: summary.A.length,
          totalValue: summary.A.reduce((sum, p) => sum + p.totalValue, 0),
          percentage: 80
        },
        B: {
          count: summary.B.length,
          totalValue: summary.B.reduce((sum, p) => sum + p.totalValue, 0),
          percentage: 15
        },
        C: {
          count: summary.C.length,
          totalValue: summary.C.reduce((sum, p) => sum + p.totalValue, 0),
          percentage: 5
        }
      }
    });
  } catch (error) {
    console.error('ABC analysis error:', error);
    res.status(500).json({ error: 'ABC analizi yapılamadı' });
  }
};

// 📅 Stok yaşlanma raporu
export const getAgingReport = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Son hareketlere göre ürünleri grupla
    const products = await prisma.product.findMany({
      include: {
        category: true,
        stockMovements: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    const aging = {
      '0-30': [] as any[],
      '31-60': [] as any[],
      '61-90': [] as any[],
      '90+': [] as any[]
    };

    products.forEach(product => {
      const lastMovement = product.stockMovements[0]?.createdAt;
      if (!lastMovement) {
        aging['90+'].push(product);
        return;
      }

      if (lastMovement >= thirtyDaysAgo) {
        aging['0-30'].push(product);
      } else if (lastMovement >= sixtyDaysAgo) {
        aging['31-60'].push(product);
      } else if (lastMovement >= ninetyDaysAgo) {
        aging['61-90'].push(product);
      } else {
        aging['90+'].push(product);
      }
    });

    res.json({
      aging,
      summary: {
        '0-30': { count: aging['0-30'].length, value: aging['0-30'].reduce((sum, p) => sum + (p.stock * p.buyPrice), 0) },
        '31-60': { count: aging['31-60'].length, value: aging['31-60'].reduce((sum, p) => sum + (p.stock * p.buyPrice), 0) },
        '61-90': { count: aging['61-90'].length, value: aging['61-90'].reduce((sum, p) => sum + (p.stock * p.buyPrice), 0) },
        '90+': { count: aging['90+'].length, value: aging['90+'].reduce((sum, p) => sum + (p.stock * p.buyPrice), 0) }
      }
    });
  } catch (error) {
    console.error('Aging report error:', error);
    res.status(500).json({ error: 'Yaşlanma raporu alınamadı' });
  }
};

// 🔄 Stok devir hızı raporu
export const getTurnoverRate = async (req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Son 30 günlük satış hareketleri
    const movements = await prisma.stockMovement.groupBy({
      by: ['productId'],
      where: {
        type: 'OUT',
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      _sum: {
        quantity: true
      }
    });

    // Ürün detaylarını al
    const productIds = movements.map(m => m.productId);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds
        }
      },
      include: {
        category: true
      }
    });

    // Devir hızını hesapla
    const turnoverData = movements.map(m => {
      const product = products.find(p => p.id === m.productId);
      const soldQuantity = m._sum.quantity || 0;
      const avgStock = product?.stock || 1;
      const turnoverRate = avgStock > 0 ? (soldQuantity / avgStock) * 30 : 0;

      return {
        product,
        soldQuantity,
        currentStock: avgStock,
        turnoverRate: Math.round(turnoverRate),
        status: turnoverRate > 60 ? 'fast' : turnoverRate > 30 ? 'medium' : 'slow'
      };
    });

    // Hıza göre sırala
    turnoverData.sort((a, b) => b.turnoverRate - a.turnoverRate);

    res.json({
      products: turnoverData,
      summary: {
        fast: turnoverData.filter(p => p.status === 'fast').length,
        medium: turnoverData.filter(p => p.status === 'medium').length,
        slow: turnoverData.filter(p => p.status === 'slow').length
      }
    });
  } catch (error) {
    console.error('Turnover rate error:', error);
    res.status(500).json({ error: 'Devir hızı raporu alınamadı' });
  }
};

// 📥 Excel ile ürün içe aktarma
export const importProductsFromExcel = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Excel dosyası yüklenmedi' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    let imported = 0;
    let updated = 0;
    let errors: string[] = [];

    for (const row of data as any[]) {
      try {
        const existingProduct = await prisma.product.findUnique({
          where: { barcode: row.barcode }
        });

        if (existingProduct) {
          await prisma.product.update({
            where: { barcode: row.barcode },
            data: {
              name: row.name || existingProduct.name,
              stock: row.stock !== undefined ? Number(row.stock) : existingProduct.stock,
              buyPrice: row.buyPrice !== undefined ? Number(row.buyPrice) : existingProduct.buyPrice,
              sellPrice: row.sellPrice !== undefined ? Number(row.sellPrice) : existingProduct.sellPrice,
              minStock: row.minStock !== undefined ? Number(row.minStock) : existingProduct.minStock
            }
          });
          updated++;
        } else {
          await prisma.product.create({
            data: {
              barcode: row.barcode,
              name: row.name,
              stock: Number(row.stock) || 0,
              buyPrice: Number(row.buyPrice) || 0,
              sellPrice: Number(row.sellPrice) || 0,
              minStock: Number(row.minStock) || 0,
              unit: row.unit || 'Adet',
              taxRate: Number(row.taxRate) || 18
            }
          });
          imported++;
        }
      } catch (err: any) {
        errors.push(`${row.barcode}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      imported,
      updated,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Import excel error:', error);
    res.status(500).json({ error: 'Excel içe aktarılamadı' });
  }
};

// 📤 Excel ile ürün dışa aktarma
export const exportProductsToExcel = async (req: Request, res: Response) => {
  try {
    const { categoryId, search } = req.query;

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { barcode: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true
      }
    });

    const data = products.map(p => ({
      'Barkod': p.barcode,
      'Ürün Adı': p.name,
      'Kategori': p.category?.name || '-',
      'Stok': p.stock,
      'Birim': p.unit,
      'Alış Fiyatı': p.buyPrice,
      'Satış Fiyatı': p.sellPrice,
      'Min Stok': p.minStock,
      'Max Stok': p.maxStock || '-',
      'KDV Oranı': p.taxRate,
      'Durum': p.isActive ? 'Aktif' : 'Pasif'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ürünler');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=urunler.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Export excel error:', error);
    res.status(500).json({ error: 'Excel dışa aktarılamadı' });
  }
};

// ⚡ Toplu stok güncelleme
export const bulkUpdateStock = async (req: Request, res: Response) => {
  try {
    const { updates } = req.body; // [{ productId, stock, buyPrice, sellPrice }]

    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Geçersiz veri formatı' });
    }

    let updated = 0;
    const errors: string[] = [];

    for (const update of updates) {
      try {
        const data: any = {};
        if (update.stock !== undefined) data.stock = Number(update.stock);
        if (update.buyPrice !== undefined) data.buyPrice = Number(update.buyPrice);
        if (update.sellPrice !== undefined) data.sellPrice = Number(update.sellPrice);
        if (update.minStock !== undefined) data.minStock = Number(update.minStock);

        await prisma.product.update({
          where: { id: update.productId },
          data
        });
        updated++;
      } catch (err: any) {
        errors.push(`${update.productId}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      updated,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Toplu güncelleme yapılamadı' });
  }
};

// ⚡ Toplu fiyat güncelleme (kategori bazlı)
export const bulkUpdatePrices = async (req: Request, res: Response) => {
  try {
    const { categoryId, operation, value } = req.body;
    // operation: 'increase' | 'decrease' | 'set'
    // value: yüzde veya sabit değer

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;

    const products = await prisma.product.findMany({ where });

    let updated = 0;

    for (const product of products) {
      let newPrice = product.sellPrice;

      if (operation === 'increase') {
        newPrice = product.sellPrice * (1 + value / 100);
      } else if (operation === 'decrease') {
        newPrice = product.sellPrice * (1 - value / 100);
      } else if (operation === 'set') {
        newPrice = value;
      }

      await prisma.product.update({
        where: { id: product.id },
        data: { sellPrice: newPrice }
      });
      updated++;
    }

    res.json({
      success: true,
      updated
    });
  } catch (error) {
    console.error('Bulk price update error:', error);
    res.status(500).json({ error: 'Toplu fiyat güncellemesi yapılamadı' });
  }
};
