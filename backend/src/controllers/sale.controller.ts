import { Request, Response } from 'express';
import prisma from '../lib/prisma';
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
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // items'ı formatla (frontend için)
    const formattedSales = sales.map(sale => ({
      ...sale,
      items: sale.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.unitPrice,
        product: {
          name: item.product.name,
          barcode: item.product.barcode,
        },
      })),
    }));

    res.json({ sales: formattedSales });
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
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Satış bulunamadı' });
    }

    // items'ı items olarak map et
    const formattedSale = {
      ...sale,
      items: sale.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.unitPrice,
        product: {
          name: item.product.name,
          barcode: item.product.barcode,
        },
      })),
    };

    res.json({ sale: formattedSale });
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

    const processedItems = await Promise.all(
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

        const itemTotal = product.sellPrice * item.quantity;
        const itemTax = (itemTotal * product.taxRate) / 100;

        totalAmount += itemTotal;
        taxAmount += itemTax;

        return {
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.sellPrice,
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
          total: totalAmount,
          discountAmount: finalDiscountAmount,
          taxAmount,
          subtotal: netAmount,
          paymentMethod: paymentMethod || 'CASH',
          userId: req.userId!,
          customerId,
          notes,
          items: {
            create: processedItems,
          },
        },
        include: {
          items: {
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
      for (const item of processedItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Veresiye ise müşterinin borcunu artır
      if (paymentMethod === 'CREDIT' && customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            debt: {
              increment: netAmount,
            },
          },
        });
      }

      return newSale;
    });

    // items'ı items olarak map et
    const formattedSale = {
      ...sale,
      items: sale.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.unitPrice,
        product: {
          name: item.product.name,
          barcode: item.product.barcode,
        },
      })),
    };

    res.status(201).json({ message: 'Satış başarıyla oluşturuldu', sale: formattedSale });
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
        items: true,
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Satış bulunamadı' });
    }

    await prisma.$transaction(async (tx) => {
      // Stokları geri ekle
      for (const item of sale.items) {
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


