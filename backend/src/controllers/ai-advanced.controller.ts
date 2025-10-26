import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import cron from 'node-cron';
import { io } from '../server';

// 🔮 FEATURE 4: Smart Predictions & AI Insights
export const getSmartPredictions = async (req: Request, res: Response) => {
  try {
    // Check low stock products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: { lte: 10 },
        isActive: true,
      },
      take: 5,
      orderBy: { stock: 'asc' },
    });

    // Check products not sold in last 10 days
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const recentSales = await prisma.saleItem.findMany({
      where: {
        createdAt: { gte: tenDaysAgo },
      },
      select: { productId: true },
      distinct: ['productId'],
    });

    const soldProductIds = recentSales.map(s => s.productId);
    const unsoldProducts = await prisma.product.findMany({
      where: {
        id: { notIn: soldProductIds },
        isActive: true,
      },
      take: 5,
    });

    const predictions = [
      ...lowStockProducts.map(p => ({
        type: 'LOW_STOCK',
        severity: 'HIGH',
        message: `⚠️ ${p.name} stoğu azaldı! (${p.stock} adet kaldı)`,
        action: 'Sipariş verin',
        productId: p.id,
      })),
      ...unsoldProducts.map(p => ({
        type: 'SLOW_MOVING',
        severity: 'MEDIUM',
        message: `📉 ${p.name} son 10 günde satılmadı`,
        action: 'İndirim yapın',
        productId: p.id,
      })),
    ];

    res.json({
      success: true,
      predictions,
      count: predictions.length,
    });
  } catch (error: any) {
    console.error('❌ Smart predictions error:', error);
    res.status(500).json({ error: 'Tahminler alınamadı: ' + error.message });
  }
};

// 🔔 FEATURE 5: Real-time Notifications
export const sendRealtimeAlert = async (req: Request, res: Response) => {
  try {
    const { title, message, type, userId } = req.body;

    // Emit via Socket.IO
    if (userId) {
      io.to(userId).emit('ai-alert', { title, message, type, timestamp: new Date() });
    } else {
      io.emit('ai-alert', { title, message, type, timestamp: new Date() });
    }

    res.json({
      success: true,
      message: 'Bildirim gönderildi',
    });
  } catch (error: any) {
    console.error('❌ Send alert error:', error);
    res.status(500).json({ error: 'Bildirim gönderilemedi: ' + error.message });
  }
};

// 🔍 FEATURE 6: Advanced Natural Language Query
export const executeNaturalQuery = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    let results: any = [];
    let message = '';

    // Simple pattern matching for common queries
    if (query.includes('borç') && (query.includes('müşteri') || query.includes('fazla'))) {
      // "Borcu 100 TL'den fazla olan müşteriler"
      const match = query.match(/(\d+)/);
      const threshold = match ? parseInt(match[1]) : 100;

      results = await prisma.customer.findMany({
        where: { debt: { gte: threshold } },
        orderBy: { debt: 'desc' },
        take: 20,
      });
      message = `${threshold} TL'den fazla borcu olan ${results.length} müşteri bulundu`;
    } else if (query.includes('en çok') && query.includes('ürün')) {
      // "En çok satan ürünler"
      const topProducts = await prisma.saleItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      });

      results = await Promise.all(
        topProducts.map(async item => {
          const product = await prisma.product.findUnique({ where: { id: item.productId } });
          return {
            ...product,
            totalSold: item._sum.quantity,
          };
        })
      );
      message = `En çok satan ${results.length} ürün listelendi`;
    } else {
      message = 'Sorgu anlaşılamadı. Daha spesifik olun.';
    }

    res.json({
      success: true,
      results,
      message,
      count: results.length,
    });
  } catch (error: any) {
    console.error('❌ Natural query error:', error);
    res.status(500).json({ error: 'Sorgu çalıştırılamadı: ' + error.message });
  }
};

// ⏰ FEATURE 7: Create Scheduled Task
export const createScheduledTask = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { name, description, actionType, actionData, schedule } = req.body;

    if (!userId || !name || !actionType || !schedule) {
      return res.status(400).json({ error: 'Gerekli alanlar eksik' });
    }

    const task = await prisma.scheduledTask.create({
      data: {
        userId,
        name,
        description,
        actionType,
        actionData,
        schedule,
      },
    });

    // TODO: Register cron job dynamically
    console.log(`✅ Görev oluşturuldu: ${name} (${schedule})`);

    res.json({
      success: true,
      message: `Görev "${name}" oluşturuldu`,
      task,
    });
  } catch (error: any) {
    console.error('❌ Create scheduled task error:', error);
    res.status(500).json({ error: 'Görev oluşturulamadı: ' + error.message });
  }
};

// 📄 FEATURE 8: Export Report (PDF/Excel placeholder)
export const exportReport = async (req: Request, res: Response) => {
  try {
    const { reportType, format, period } = req.body;

    // Placeholder - In production, use libraries like PDFKit or ExcelJS
    const report = {
      type: reportType,
      format,
      period,
      generatedAt: new Date(),
      downloadUrl: `/reports/${reportType}-${Date.now()}.${format}`,
      message: `${reportType} raporu ${format} olarak oluşturuldu`,
    };

    res.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('❌ Export report error:', error);
    res.status(500).json({ error: 'Rapor oluşturulamadı: ' + error.message });
  }
};

// 👥 FEATURE 9: Role-based AI Context
export const getRoleBasedContext = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;

    let context = '';

    switch (userRole) {
      case 'ADMIN':
        context = 'Tam yetki - Tüm sistem verilerine erişim, stratejik kararlar, personel yönetimi';
        break;
      case 'MANAGER':
        context = 'Yönetici - Satış analizi, stok yönetimi, raporlama, kampanya oluşturma';
        break;
      case 'CASHIER':
        context = 'Kasiyer - Hızlı satış, ürün arama, müşteri işlemleri, temel raporlar';
        break;
      default:
        context = 'Standart kullanıcı';
    }

    res.json({
      success: true,
      role: userRole,
      context,
    });
  } catch (error: any) {
    console.error('❌ Role context error:', error);
    res.status(500).json({ error: 'Rol bilgisi alınamadı: ' + error.message });
  }
};

// 📱 FEATURE 10: WhatsApp/SMS Integration (Mock)
export const sendBulkMessage = async (req: Request, res: Response) => {
  try {
    const { channel, recipients, message } = req.body;

    // Mock implementation - In production, use Twilio/WhatsApp Business API
    console.log(`📱 Sending ${channel} message to ${recipients}:`, message);

    res.json({
      success: true,
      message: `${recipients.length || 'Tüm'} kişiye ${channel} mesajı gönderildi`,
      channel,
      recipientCount: recipients?.length || 0,
      status: 'MOCK_SENT', // In production: SENT, FAILED, PENDING
    });
  } catch (error: any) {
    console.error('❌ Send bulk message error:', error);
    res.status(500).json({ error: 'Mesaj gönderilemedi: ' + error.message });
  }
};

