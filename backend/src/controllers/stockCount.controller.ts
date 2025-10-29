import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';

export const getAllStockCounts = async (req: Request, res: Response) => {
  try {
    const counts = await prisma.stockCount.findMany({
      include: {
        branch: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        _count: { select: { items: true } },
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
        items: { 
          include: { 
            product: { 
              select: { 
                id: true, 
                barcode: true, 
                name: true, 
                unit: true,
                stock: true,
              } 
            } 
          },
          orderBy: { product: { name: 'asc' } },
        },
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

export const startStockCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Kullanıcı kimliği bulunamadı' });
    }

    const { type, branchId, categoryId } = req.body;

    // Generate count number
    const lastCount = await prisma.stockCount.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    const countNumber = lastCount
      ? `COUNT-${String(parseInt(lastCount.countNumber.split('-')[1]) + 1).padStart(6, '0')}`
      : 'COUNT-000001';

    // Get products based on type
    const where: any = { isActive: true };
    if (type === 'CATEGORY' && categoryId) {
      where.categoryId = categoryId;
    }

    let products = await prisma.product.findMany({ where });

    // Filter LOW_STOCK products after fetching
    if (type === 'LOW_STOCK') {
      products = products.filter(p => p.stock <= p.minStock);
    }

    if (products.length === 0) {
      return res.status(400).json({ error: 'Sayılacak ürün bulunamadı' });
    }

    // Create stock count with items
    const stockCount = await prisma.stockCount.create({
      data: {
        countNumber,
        type: type || 'FULL',
        status: 'IN_PROGRESS',
        userId,
        branchId,
        startedAt: new Date(),
        items: {
          create: products.map((product) => ({
            productId: product.id,
            systemQty: product.stock,
            countedQty: 0,
            difference: 0,
          })),
        },
      },
      include: {
        items: { 
          include: { 
            product: { 
              select: { 
                id: true, 
                barcode: true, 
                name: true, 
                unit: true,
                stock: true,
              } 
            } 
          } 
        },
        user: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    });

    res.status(201).json({ 
      stockCount, 
      message: `Stok sayımı başlatıldı: ${products.length} ürün` 
    });
  } catch (error) {
    console.error('Start stock count error:', error);
    res.status(500).json({ error: 'Stok sayımı başlatılamadı' });
  }
};

export const updateStockCountItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { itemId, countedQty } = req.body;

    // Get stock count to verify it's in progress
    const stockCount = await prisma.stockCount.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!stockCount) {
      return res.status(404).json({ error: 'Stok sayımı bulunamadı' });
    }

    if (stockCount.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Sadece devam eden sayımlar güncellenebilir' });
    }

    // Update item
    const item = await prisma.stockCountItem.findUnique({ where: { id: itemId } });
    if (!item) {
      return res.status(404).json({ error: 'Sayım kalemi bulunamadı' });
    }

    const difference = countedQty - item.systemQty;

    const updatedItem = await prisma.stockCountItem.update({
      where: { id: itemId },
      data: {
        countedQty,
        difference,
      },
      include: {
        product: {
          select: {
            id: true,
            barcode: true,
            name: true,
            unit: true,
            stock: true,
          },
        },
      },
    });

    res.json({ item: updatedItem, message: 'Sayım güncellendi' });
  } catch (error) {
    console.error('Update stock count item error:', error);
    res.status(500).json({ error: 'Sayım güncellenemedi' });
  }
};

export const completeStockCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { applyChanges } = req.body;

    const stockCount = await prisma.stockCount.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!stockCount) {
      return res.status(404).json({ error: 'Stok sayımı bulunamadı' });
    }

    if (stockCount.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Sadece devam eden sayımlar tamamlanabilir' });
    }

    // Update stock count status
    const updatedCount = await prisma.stockCount.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, name: true } },
      },
    });

    // If applyChanges is true, update product stocks and create stock movements
    if (applyChanges) {
      for (const item of stockCount.items) {
        if (item.difference !== 0) {
          // Update product stock
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: item.countedQty },
          });

          // Create stock movement
          await prisma.stockMovement.create({
            data: {
              productId: item.productId,
              type: item.difference > 0 ? 'IN' : 'OUT',
              quantity: Math.abs(item.difference),
              previousStock: item.systemQty,
              newStock: item.countedQty,
              notes: `Stok sayımı farkı: ${stockCount.countNumber}`,
              userId,
            },
          });
        }
      }
    }

    res.json({ 
      stockCount: updatedCount, 
      message: applyChanges 
        ? 'Stok sayımı tamamlandı ve stoklar güncellendi' 
        : 'Stok sayımı tamamlandı' 
    });
  } catch (error) {
    console.error('Complete stock count error:', error);
    res.status(500).json({ error: 'Stok sayımı tamamlanamadı' });
  }
};

export const cancelStockCount = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const stockCount = await prisma.stockCount.findUnique({
      where: { id },
    });

    if (!stockCount) {
      return res.status(404).json({ error: 'Stok sayımı bulunamadı' });
    }

    if (stockCount.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Sadece devam eden sayımlar iptal edilebilir' });
    }

    await prisma.stockCount.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    });

    res.json({ message: 'Stok sayımı iptal edildi' });
  } catch (error) {
    console.error('Cancel stock count error:', error);
    res.status(500).json({ error: 'Stok sayımı iptal edilemedi' });
  }
};

export const deleteStockCount = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const stockCount = await prisma.stockCount.findUnique({
      where: { id },
    });

    if (!stockCount) {
      return res.status(404).json({ error: 'Stok sayımı bulunamadı' });
    }

    if (stockCount.status === 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Devam eden sayım silinemez, önce iptal edin' });
    }

    await prisma.stockCount.delete({
      where: { id },
    });

    res.json({ message: 'Stok sayımı silindi' });
  } catch (error) {
    console.error('Delete stock count error:', error);
    res.status(500).json({ error: 'Stok sayımı silinemedi' });
  }
};

// Legacy endpoint for mobile app compatibility
export const createStockCount = async (req: AuthRequest, res: Response) => {
  try {
    const { items, totalItems } = req.body;

    console.log('📦 Creating stock count (legacy):', { itemCount: items?.length, totalItems });

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Sayım listesi boş olamaz' });
    }

    const countNumber = `SC-${Date.now()}`;

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
