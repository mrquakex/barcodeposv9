import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';

const router = Router();

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: {
        product: true,
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });
    res.json({ movements });
  } catch (error) {
    console.error('Get stock movements error:', error);
    res.status(500).json({ error: 'Stok hareketleri alınamadı' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { productId, type, quantity, notes } = req.body;
    const userId = (req as any).userId;

    // Get current product stock
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    const previousStock = product.stock;
    let newStock = previousStock;

    // Calculate new stock
    if (type === 'IN') {
      newStock = previousStock + quantity;
    } else if (type === 'OUT') {
      newStock = previousStock - quantity;
    }

    // Create movement
    const movement = await prisma.stockMovement.create({
      data: {
        productId,
        type,
        quantity,
        previousStock,
        newStock,
        notes: notes || null,
        userId: userId || null
      },
      include: {
        product: true
      }
    });

    // Update product stock
    await prisma.product.update({
      where: { id: productId },
      data: { stock: newStock }
    });

    res.json({ movement });
  } catch (error) {
    console.error('Create stock movement error:', error);
    res.status(500).json({ error: 'Stok hareketi oluşturulamadı' });
  }
});

export default router;

