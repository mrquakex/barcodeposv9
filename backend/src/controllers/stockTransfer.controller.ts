import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllStockTransfers = async (req: Request, res: Response) => {
  try {
    const transfers = await prisma.stockTransfer.findMany({
      include: {
        fromBranch: { select: { id: true, name: true } },
        toBranch: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ transfers });
  } catch (error) {
    console.error('Get stock transfers error:', error);
    res.status(500).json({ error: 'Stok transferleri getirilemedi' });
  }
};

export const getStockTransferById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: {
        fromBranch: true,
        toBranch: true,
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
    });

    if (!transfer) {
      return res.status(404).json({ error: 'Stok transferi bulunamadı' });
    }

    res.json({ transfer });
  } catch (error) {
    console.error('Get stock transfer error:', error);
    res.status(500).json({ error: 'Stok transferi getirilemedi' });
  }
};




