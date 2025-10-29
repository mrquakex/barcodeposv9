import { Request, Response } from 'express';
import prisma from '../lib/prisma';

interface AuthRequest extends Request {
  userId?: string;
}

export const getAllStockCounts = async (req: Request, res: Response) => {
  try {
    const counts = await prisma.stockCount.findMany({
      include: {
        branch: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ counts });
  } catch (error) {
    console.error('Get stock counts error:', error);
    res.status(500).json({ error: 'Stok sayımları getirilemedi' });
  }
};

export const getStockCountById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const count = await prisma.stockCount.findUnique({
      where: { id },
      include: {
        branch: true,
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
    });

    if (!count) {
      return res.status(404).json({ error: 'Stok sayımı bulunamadı' });
    }

    res.json({ count });
  } catch (error) {
    console.error('Get stock count error:', error);
    res.status(500).json({ error: 'Stok sayımı getirilemedi' });
  }
};

export const createStockCount = async (req: AuthRequest, res: Response) => {
  try {
    const { items, totalItems } = req.body;

    console.log('📦 Creating stock count:', { itemCount: items?.length, totalItems });

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Sayım listesi boş olamaz' });
    }

    // Generate unique count number
    const countNumber = `SC-${Date.now()}`;

    // Create stock count with items
    const stockCount = await prisma.stockCount.create({
      data: {
        countNumber,
        type: 'PARTIAL',
        status: 'COMPLETED',
        userId: req.userId!,
        completedAt: new Date(),
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            systemQty: item.currentStock,
            countedQty: item.countedStock,
            difference: item.difference,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, name: true } },
      },
    });

    // Update product stocks based on counted stock
    await Promise.all(
      items.map((item: any) =>
        prisma.product.update({
          where: { id: item.productId },
          data: { stock: item.countedStock },
        })
      )
    );

    console.log('✅ Stock count created:', stockCount.id);

    res.status(201).json({
      message: 'Stok sayımı başarıyla kaydedildi',
      stockCount,
    });
  } catch (error) {
    console.error('❌ Create stock count error:', error);
    res.status(500).json({ error: 'Stok sayımı kaydedilemedi' });
  }
};
