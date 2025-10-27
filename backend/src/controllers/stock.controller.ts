import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getStockMovements = async (req: Request, res: Response) => {
  try {
    const { productId, type, startDate, endDate } = req.query;
    const where: any = {};

    if (productId) where.productId = productId as string;
    if (type) where.type = type as string;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: { product: true, user: { select: { name: true } }, branch: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ movements });
  } catch (error) {
    console.error('Get stock movements error:', error);
    res.status(500).json({ error: 'Stok hareketleri getirilemedi' });
  }
};

export const createStockMovement = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, type, quantity, notes, referenceType, referenceId } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    const previousStock = product.stock;
    let newStock = previousStock;

    if (type === 'IN') {
      newStock += quantity;
    } else if (type === 'OUT') {
      newStock -= quantity;
      if (newStock < 0) {
        return res.status(400).json({ error: 'Yetersiz stok' });
      }
    }

    await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          productId,
          type,
          quantity,
          previousStock,
          newStock,
          notes,
          referenceType,
          referenceId,
          userId: req.userId,
        },
      }),
      prisma.product.update({
        where: { id: productId },
        data: { stock: newStock },
      }),
    ]);

    res.status(201).json({ message: 'Stok hareketi kaydedildi' });
  } catch (error) {
    console.error('Create stock movement error:', error);
    res.status(500).json({ error: 'Stok hareketi oluşturulamadı' });
  }
};


