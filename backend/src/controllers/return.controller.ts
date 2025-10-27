import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllReturns = async (req: Request, res: Response) => {
  try {
    const returns = await prisma.return.findMany({
      include: {
        sale: { select: { id: true, saleNumber: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ returns });
  } catch (error) {
    console.error('Get returns error:', error);
    res.status(500).json({ error: 'İadeler getirilemedi' });
  }
};

export const getReturnById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const returnDoc = await prisma.return.findUnique({
      where: { id },
      include: {
        sale: { include: { items: { include: { product: true } } } },
        items: { include: { product: true } },
      },
    });

    if (!returnDoc) {
      return res.status(404).json({ error: 'İade bulunamadı' });
    }

    res.json({ return: returnDoc });
  } catch (error) {
    console.error('Get return error:', error);
    res.status(500).json({ error: 'İade getirilemedi' });
  }
};




