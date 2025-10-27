import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      include: {
        supplier: { select: { id: true, name: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ orders });
  } catch (error) {
    console.error('Get purchase orders error:', error);
    res.status(500).json({ error: 'Satın alma siparişleri getirilemedi' });
  }
};

export const getPurchaseOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Satın alma siparişi bulunamadı' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get purchase order error:', error);
    res.status(500).json({ error: 'Satın alma siparişi getirilemedi' });
  }
};




