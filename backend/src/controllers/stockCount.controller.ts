import { Request, Response } from 'express';
import prisma from '../lib/prisma';

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




