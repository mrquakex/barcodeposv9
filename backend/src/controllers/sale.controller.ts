import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllSales = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, customerId, userId } = req.query;

    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    if (customerId) {
      where.customerId = customerId as string;
    }

    if (userId) {
      where.userId = userId as string;
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: true,
        saleItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ sales });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ error: 'Satışlar getirilemedi' });
  }
};

export const getSaleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: true,
        saleItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Satış bulunamadı' });
    }

    res.json({ sale });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({ error: 'Satış getirilemedi' });
  }
};

export const createSale = async (req: AuthRequest, res: Response) => {
  try {
    const { items, customerId, paymentMethod, discountAmount, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Satış için en az bir ürün gerekli' });
    }

    // Toplam hesaplama
    let totalAmount = 0;
    let taxAmount = 0;

    const saleItems = await Promise.all(
      items.map(async (item: any) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Ürün bulunamadı: ${item.productId}`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`${product.name} için yeterli stok yok`);
        }

        const itemTotal = product.price * item.quantity;
        const itemTax = (itemTotal * product.taxRate) / 100;

        totalAmount += itemTotal;
        taxAmount += itemTax;

        return {
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.price,
          taxRate: product.taxRate,
          total: itemTotal,
        };
      })
    );

    const finalDiscountAmount = discountAmount || 0;
    const netAmount = totalAmount - finalDiscountAmount;

    // Satış numarası oluştur
    const saleCount = await prisma.sale.count();
    const saleNumber = `SAT-${String(saleCount + 1).padStart(6, '0')}`;

    // Transaction ile satış ve stok güncelleme
    const sale = await prisma.$transaction(async (tx) => {
      // Satış oluştur
      const newSale = await tx.sale.create({
        data: {
          saleNumber,
          totalAmount,
          discountAmount: finalDiscountAmount,
          taxAmount,
          netAmount,
          paymentMethod: paymentMethod || 'CASH',
          userId: req.userId!,
          customerId,
          notes,
          saleItems: {
            create: saleItems,
          },
        },
        include: {
          saleItems: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          customer: true,
        },
      });

      // Stokları güncelle
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return newSale;
    });

    res.status(201).json({ message: 'Satış başarıyla oluşturuldu', sale });
  } catch (error: any) {
    console.error('Create sale error:', error);
    res.status(500).json({ error: error.message || 'Satış oluşturulamadı' });
  }
};

export const deleteSale = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Satışı ve ilgili stokları geri al
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        saleItems: true,
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Satış bulunamadı' });
    }

    await prisma.$transaction(async (tx) => {
      // Stokları geri ekle
      for (const item of sale.saleItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      // Satışı sil
      await tx.sale.delete({
        where: { id },
      });
    });

    res.json({ message: 'Satış başarıyla iptal edildi' });
  } catch (error) {
    console.error('Delete sale error:', error);
    res.status(500).json({ error: 'Satış iptal edilemedi' });
  }
};


