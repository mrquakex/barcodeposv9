import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllReturns = async (req: Request, res: Response) => {
  try {
    const returns = await prisma.return.findMany({
      include: {
        sale: { select: { id: true, saleNumber: true } },
        items: { include: { product: true } },
        user: { select: { id: true, name: true } },
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
    const returnRecord = await prisma.return.findUnique({
      where: { id },
      include: {
        sale: { 
          select: { 
            id: true, 
            saleNumber: true,
            customer: true,
          } 
        },
        items: { include: { product: true } },
        user: { select: { id: true, name: true } },
      },
    });

    if (!returnRecord) {
      return res.status(404).json({ error: 'İade bulunamadı' });
    }

    res.json({ return: returnRecord });
  } catch (error) {
    console.error('Get return error:', error);
    res.status(500).json({ error: 'İade getirilemedi' });
  }
};

export const createReturn = async (req: AuthRequest, res: Response) => {
  try {
    const { saleId, items, reason, refundMethod, notes } = req.body;

    if (!saleId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Satış ve ürünler gereklidir' });
    }

    // Validate sale exists
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Satış bulunamadı' });
    }

    // Calculate refund amount
    let refundAmount = 0;
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.price) {
        return res.status(400).json({ error: 'Tüm ürün bilgileri gereklidir' });
      }
      refundAmount += item.quantity * item.price;
    }

    // Generate return number
    const returnCount = await prisma.return.count();
    const returnNumber = `RET-${new Date().getFullYear()}-${String(returnCount + 1).padStart(6, '0')}`;

    // Create return
    const returnRecord = await prisma.return.create({
      data: {
        returnNumber,
        saleId,
        reason: reason || 'Diğer',
        status: 'PENDING',
        refundAmount,
        refundMethod: refundMethod || 'CASH',
        userId: req.user!.id,
        notes,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price,
          })),
        },
      },
      include: {
        sale: { select: { id: true, saleNumber: true } },
        items: { include: { product: true } },
        user: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ return: returnRecord, message: 'İade oluşturuldu' });
  } catch (error: any) {
    console.error('Create return error:', error);
    res.status(500).json({ error: error.message || 'İade oluşturulamadı' });
  }
};

export const updateReturnStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Geçersiz durum' });
    }

    const updateData: any = { status };

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const returnRecord = await prisma.return.update({
      where: { id },
      data: updateData,
      include: {
        sale: { select: { id: true, saleNumber: true } },
        items: { include: { product: true } },
        user: { select: { id: true, name: true } },
      },
    });

    res.json({ return: returnRecord, message: 'İade durumu güncellendi' });
  } catch (error: any) {
    console.error('Update return status error:', error);
    res.status(500).json({ error: error.message || 'İade durumu güncellenemedi' });
  }
};

export const completeReturn = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const returnRecord = await prisma.return.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!returnRecord) {
      return res.status(404).json({ error: 'İade bulunamadı' });
    }

    if (returnRecord.status === 'COMPLETED') {
      return res.status(400).json({ error: 'İade zaten tamamlanmış' });
    }

    if (returnRecord.status === 'REJECTED') {
      return res.status(400).json({ error: 'Reddedilmiş iade tamamlanamaz' });
    }

    // Return products to stock
    for (const item of returnRecord.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });

      // Create stock movement
      await prisma.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'IN',
          quantity: item.quantity,
          reason: `İade: ${returnRecord.returnNumber}`,
          userId: req.user!.id,
        },
      });
    }

    // Update return status
    const updatedReturn = await prisma.return.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        sale: { select: { id: true, saleNumber: true } },
        items: { include: { product: true } },
        user: { select: { id: true, name: true } },
      },
    });

    res.json({ 
      return: updatedReturn, 
      message: 'İade tamamlandı ve ürünler stoka eklendi' 
    });
  } catch (error: any) {
    console.error('Complete return error:', error);
    res.status(500).json({ error: error.message || 'İade tamamlanamadı' });
  }
};

export const deleteReturn = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const returnRecord = await prisma.return.findUnique({ where: { id } });
    if (!returnRecord) {
      return res.status(404).json({ error: 'İade bulunamadı' });
    }

    if (returnRecord.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Tamamlanmış iade silinemez' });
    }

    await prisma.return.delete({ where: { id } });

    res.json({ message: 'İade silindi' });
  } catch (error: any) {
    console.error('Delete return error:', error);
    res.status(500).json({ error: error.message || 'İade silinemedi' });
  }
};
