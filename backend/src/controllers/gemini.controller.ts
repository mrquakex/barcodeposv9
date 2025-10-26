import { Request, Response } from 'express';
import { geminiService } from '../services/gemini.service';
import prisma from '../lib/prisma';

export const chatWithAI = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mesaj gerekli' });
    }

    // Sistem verilerini topla (AI için context)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentSales, products, customers, topProducts] = await Promise.all([
      // Son 30 günün satışları
      prisma.sale.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
        include: {
          saleItems: {
            include: {
              product: true,
            },
          },
          customer: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      // Toplam ürün sayısı
      prisma.product.count(),
      // Toplam müşteri sayısı
      prisma.customer.count(),
      // En çok satan ürünler (son 30 gün)
      prisma.saleItem.groupBy({
        by: ['productId'],
        _sum: {
          quantity: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    // Satış özeti oluştur
    const totalRevenue = recentSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const averageSale = recentSales.length > 0 ? totalRevenue / recentSales.length : 0;
    
    // En çok satan ürünlerin detaylarını al
    const topProductDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });
        return {
          name: product?.name,
          totalSold: item._sum.quantity,
        };
      })
    );

    // AI için context hazırla
    const context = {
      summary: {
        totalSales: recentSales.length,
        totalRevenue: totalRevenue.toFixed(2),
        averageSale: averageSale.toFixed(2),
        totalProducts: products,
        totalCustomers: customers,
        period: 'Son 30 gün',
      },
      topProducts: topProductDetails,
      recentSalesCount: recentSales.length,
    };

    // AI'ye context ile birlikte mesaj gönder
    const response = await geminiService.chat(message, context);

    res.json({
      success: true,
      message: response,
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'AI ile iletişim kurulamadı',
    });
  }
};

export const getBusinessInsights = async (req: Request, res: Response) => {
  try {
    // İş verilerini topla
    const [sales, products, customers] = await Promise.all([
      prisma.sale.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const insights = await geminiService.analyzeBusinessData({
      sales,
      products,
      customers,
    });

    res.json({
      success: true,
      insights,
    });
  } catch (error: any) {
    console.error('Business insights error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'İş önerileri alınamadı',
    });
  }
};

export const getSuggestedProducts = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.query;

    let customerHistory;
    if (customerId) {
      // Müşteri geçmişini al
      customerHistory = await prisma.sale.findMany({
        where: { customerId: customerId as string },
        include: {
          saleItems: {
            include: {
              product: true,
            },
          },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    }

    const suggestions = await geminiService.suggestProducts(customerHistory);

    res.json({
      success: true,
      suggestions,
    });
  } catch (error: any) {
    console.error('Product suggestions error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ürün önerileri alınamadı',
    });
  }
};

