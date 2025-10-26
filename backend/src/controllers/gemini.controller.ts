import { Request, Response } from 'express';
import { geminiService } from '../services/gemini.service';
import prisma from '../lib/prisma';

export const chatWithAI = async (req: Request, res: Response) => {
  try {
    const { message, sessionId } = req.body;
    const userId = (req as any).user?.id; // From auth middleware

    if (!message) {
      return res.status(400).json({ error: 'Mesaj gerekli' });
    }

    const startTime = Date.now();

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

    const responseTime = Date.now() - startTime;

    // Parse action from AI response
    let actionType = null;
    let actionData = null;
    const actionMatch = response.match(/\[ACTION:([A-Z_]+)(?::(.+?))?\]/);
    if (actionMatch) {
      actionType = actionMatch[1];
      if (actionMatch[2]) {
        try {
          actionData = JSON.parse(actionMatch[2]);
        } catch (e) {
          console.warn('Failed to parse action data:', e);
        }
      }
    }

    // 🧠 Konuşmayı veritabanına kaydet
    if (userId) {
      await prisma.conversation.create({
        data: {
          userId,
          userMessage: message,
          aiResponse: response,
          actionType,
          actionData,
          conversationSession: sessionId || null,
          metadata: {
            responseTime,
            contextSize: JSON.stringify(context).length,
          },
        },
      });
    }

    res.json({
      success: true,
      message: response,
      metadata: {
        responseTime,
      },
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

// 🧠 Get conversation history
export const getConversationHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { limit = 50, sessionId } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const where: any = { userId };
    if (sessionId) {
      where.conversationSession = sessionId as string;
    }

    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      select: {
        id: true,
        userMessage: true,
        aiResponse: true,
        actionType: true,
        conversationSession: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      conversations: conversations.reverse(), // oldest first
      count: conversations.length,
    });
  } catch (error: any) {
    console.error('Get conversation history error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Konuşma geçmişi alınamadı',
    });
  }
};

// 🧠 Get conversation sessions (grouped)
export const getConversationSessions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get unique sessions with counts
    const sessions = await prisma.conversation.groupBy({
      by: ['conversationSession'],
      where: {
        userId,
        conversationSession: { not: null },
      },
      _count: true,
      _max: {
        createdAt: true,
      },
      orderBy: {
        _max: {
          createdAt: 'desc',
        },
      },
      take: 20,
    });

    res.json({
      success: true,
      sessions: sessions.map(s => ({
        sessionId: s.conversationSession,
        messageCount: s._count,
        lastMessageAt: s._max.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Get conversation sessions error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Oturum listesi alınamadı',
    });
  }
};

// 🧠 Clear conversation history
export const clearConversationHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { sessionId, before } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const where: any = { userId };
    if (sessionId) {
      where.conversationSession = sessionId;
    }
    if (before) {
      where.createdAt = { lt: new Date(before) };
    }

    const result = await prisma.conversation.deleteMany({ where });

    res.json({
      success: true,
      message: `${result.count} konuşma silindi`,
      deletedCount: result.count,
    });
  } catch (error: any) {
    console.error('Clear conversation history error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Konuşma geçmişi silinemedi',
    });
  }
};

