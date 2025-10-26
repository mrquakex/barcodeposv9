import { Request, Response } from 'express';
import prisma from '../lib/prisma';
// import benimPOSScraperService from '../services/benimpos-scraper.service'; // TEMPORARILY DISABLED
import { io } from '../server';

// 🔄 FAVORİ FIYAT DEĞİŞİKLİKLERİNİ GETİR
export const getPriceChanges = async (req: Request, res: Response) => {
  try {
    const { status, limit = 50 } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const priceChanges = await prisma.priceChange.findMany({
      where,
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });

    // Group by status
    const stats = await prisma.priceChange.groupBy({
      by: ['status'],
      _count: true,
    });

    res.json({
      priceChanges,
      stats: stats.reduce((acc: any, curr) => {
        acc[curr.status] = curr._count;
        return acc;
      }, {}),
      total: priceChanges.length,
    });
  } catch (error: any) {
    console.error('Get price changes error:', error);
    res.status(500).json({ error: 'Fiyat değişiklikleri getirilemedi' });
  }
};

// 🎯 FİYAT DEĞİŞİKLİĞİNİ UYGULA
export const applyPriceChange = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const priceChange = await prisma.priceChange.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!priceChange) {
      return res.status(404).json({ error: 'Fiyat değişikliği bulunamadı' });
    }

    if (priceChange.status === 'APPLIED') {
      return res.status(400).json({ error: 'Bu değişiklik zaten uygulanmış' });
    }

    // Update product price
    await prisma.product.update({
      where: { id: priceChange.productId },
      data: { price: priceChange.newPrice },
    });

    // Update price change status
    await prisma.priceChange.update({
      where: { id },
      data: { status: 'APPLIED' },
    });

    // Send WebSocket notification
    io.emit('price-applied', {
      priceChangeId: id,
      productName: priceChange.product.name,
      newPrice: priceChange.newPrice,
    });

    res.json({
      success: true,
      message: 'Fiyat güncellendi',
      priceChange,
    });
  } catch (error: any) {
    console.error('Apply price change error:', error);
    res.status(500).json({ error: 'Fiyat güncellenemedi' });
  }
};

// ❌ FİYAT DEĞİŞİKLİĞİNİ YOKSAY
export const ignorePriceChange = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const priceChange = await prisma.priceChange.update({
      where: { id },
      data: { status: 'IGNORED' },
    });

    res.json({
      success: true,
      message: 'Fiyat değişikliği yoksayıldı',
      priceChange,
    });
  } catch (error: any) {
    console.error('Ignore price change error:', error);
    res.status(500).json({ error: 'İşlem başarısız' });
  }
};

// 🔄 TOPLU UYGULA
export const applyMultiplePriceChanges = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Geçersiz ID listesi' });
    }

    const priceChanges = await prisma.priceChange.findMany({
      where: { 
        id: { in: ids },
        status: 'PENDING'
      },
      include: { product: true },
    });

    // Update all products
    for (const change of priceChanges) {
      await prisma.product.update({
        where: { id: change.productId },
        data: { price: change.newPrice },
      });
    }

    // Update all price changes
    await prisma.priceChange.updateMany({
      where: { id: { in: ids } },
      data: { status: 'APPLIED' },
    });

    // Send WebSocket notification
    io.emit('bulk-price-applied', {
      count: priceChanges.length,
    });

    res.json({
      success: true,
      message: `${priceChanges.length} ürün fiyatı güncellendi`,
      updatedCount: priceChanges.length,
    });
  } catch (error: any) {
    console.error('Apply multiple price changes error:', error);
    res.status(500).json({ error: 'Toplu güncelleme başarısız' });
  }
};

// 🕷️ MANUEL SCRAPING BAŞLAT (TEMPORARILY DISABLED)
export const runManualScraping = async (req: Request, res: Response) => {
  try {
    res.status(503).json({ 
      success: false, 
      error: 'Fiyat tarama özelliği geçici olarak devre dışı (TypeScript build sorunları nedeniyle)',
      message: 'Bu özellik yakında tekrar aktif edilecek'
    });
  } catch (error: any) {
    console.error('❌ MANUAL SCRAPING ERROR:', error);
    res.status(500).json({ error: 'Scraping başlatılamadı: ' + error.message });
  }
};

// ⚙️ SCRAPER AYARLARINI GETİR
export const getScraperConfig = async (req: Request, res: Response) => {
  try {
    const config = await prisma.scraperConfig.findUnique({
      where: { source: 'BENIMPOS' },
    });

    if (!config) {
      return res.status(404).json({ error: 'Scraper ayarları bulunamadı' });
    }

    // Don't send password to frontend
    const { password, ...safeConfig } = config;

    res.json(safeConfig);
  } catch (error: any) {
    console.error('Get scraper config error:', error);
    res.status(500).json({ error: 'Ayarlar getirilemedi' });
  }
};

// ⚙️ SCRAPER AYARLARINI GÜNCELLE
export const updateScraperConfig = async (req: Request, res: Response) => {
  try {
    const { email, password, isActive, cronSchedule } = req.body;

    const updateData: any = {};
    if (email) updateData.email = email;
    if (password) updateData.password = password; // TODO: Encrypt
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (cronSchedule) updateData.cronSchedule = cronSchedule;

    const config = await prisma.scraperConfig.upsert({
      where: { source: 'BENIMPOS' },
      update: updateData,
      create: {
        source: 'BENIMPOS',
        email: email || 'mrquakex0@gmail.com',
        password: password || 'elwerci12',
        isActive: isActive ?? true,
        cronSchedule: cronSchedule || '0 9 * * *',
      },
    });

    // Don't send password to frontend
    const { password: _, ...safeConfig } = config;

    res.json({
      success: true,
      message: 'Ayarlar güncellendi',
      config: safeConfig,
    });
  } catch (error: any) {
    console.error('Update scraper config error:', error);
    res.status(500).json({ error: 'Ayarlar güncellenemedi' });
  }
};

// 📊 FİYAT DEĞİŞİKLİK İSTATİSTİKLERİ
export const getPriceChangeStats = async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));

    const stats = await prisma.priceChange.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: daysAgo },
      },
      _count: true,
      _avg: {
        percentage: true,
      },
    });

    const total = await prisma.priceChange.count({
      where: { createdAt: { gte: daysAgo } },
    });

    const lastScrape = await prisma.scraperConfig.findUnique({
      where: { source: 'BENIMPOS' },
      select: { lastRun: true, lastStatus: true },
    });

    res.json({
      total,
      stats: stats.map(s => ({
        status: s.status,
        count: s._count,
        avgPercentage: s._avg.percentage?.toFixed(2),
      })),
      lastScrape,
    });
  } catch (error: any) {
    console.error('Get price change stats error:', error);
    res.status(500).json({ error: 'İstatistikler getirilemedi' });
  }
};

// 🗑️ TARAMAYI SIFIRLA (TÜM PENDING DEĞİŞİKLİKLERİ SİL)
export const clearAllPendingChanges = async (req: Request, res: Response) => {
  try {
    const result = await prisma.priceChange.deleteMany({
      where: { status: 'PENDING' }
    });

    console.log(`🗑️  ${result.count} adet PENDING fiyat değişikliği silindi`);

    // Send WebSocket notification
    io.emit('price-changes-cleared', {
      count: result.count,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: `${result.count} adet fiyat değişikliği temizlendi`,
      count: result.count,
    });
  } catch (error: any) {
    console.error('Clear pending changes error:', error);
    res.status(500).json({ error: 'Temizleme işlemi başarısız' });
  }
};

