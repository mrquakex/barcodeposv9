import { Request, Response } from 'express';
import { geminiService } from '../services/gemini.service';
import prisma from '../lib/prisma';

export const chatWithAI = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mesaj gerekli' });
    }

    const response = await geminiService.chat(message);

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
          items: {
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

