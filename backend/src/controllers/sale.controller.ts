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
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        discount: item.discount,
        total: item.total,
        product: item.product,
      })),
    }));

    res.json(formattedSales);
  } catch (error) {
    console.error('Get all sales error:', error);
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

    // items'ı formatla (frontend için)
    const formattedSale = {
      ...sale,
      items: sale.items.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        discount: item.discount,
        total: item.total,
        product: item.product,
      })),
    };

    res.json(formattedSale);
  } catch (error) {
    console.error('Get sale by id error:', error);
    res.status(500).json({ error: 'Satış getirilemedi' });
  }
};

export const createSale = async (req: AuthRequest, res: Response) => {
  try {
    const {
      customerId,
      items,
      paymentMethod,
      subtotal,
      taxAmount,
      total,
      splitPayment,
      discountAmount,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Satış kalemleri gerekli' });
    }

    if (!req.userId) {
      return res.status(401).json({ error: 'Kullanıcı kimliği bulunamadı' });
    }

    // Veresiye satış için müşteri kontrolü
    if ((paymentMethod === 'CREDIT' || paymentMethod === 'SPLIT') && !customerId) {
      return res.status(400).json({ error: 'Veresiye satış için müşteri seçilmeli' });
    }

    // Fiş numarası oluştur
    const saleNumber = `FIS-${Date.now()}`;

    const sale = await prisma.$transaction(async (tx) => {
      // Satış oluştur
      const createdSale = await tx.sale.create({
        data: {
          saleNumber,
          customerId: customerId || null,
          userId: req.userId!,
          subtotal,
          discountAmount: discountAmount || 0,
          taxAmount,
          total,
          paymentMethod: paymentMethod || 'CASH',
          paymentDetails: splitPayment ? JSON.stringify(splitPayment) : null,
          isPaid: paymentMethod === 'CREDIT' ? false : true,
          status: 'COMPLETED',
        },
      });

      // Satış kalemlerini oluştur ve stokları düş
      for (const item of items) {
        // 💠 MUHTELIF (Miscellaneous) Item Handling
        const isMuhtelifItem = item.productId.startsWith('muhtelif-');
        
        let productId = item.productId;
        let product = null;

        if (isMuhtelifItem) {
          // Muhtelif item için özel "Muhtelif Tutar" ürününü kullan
          const muhtelifProduct = await tx.product.findUnique({
            where: { barcode: 'MUHTELIF' },
          });

          if (!muhtelifProduct) {
            throw new Error('Muhtelif ürünü bulunamadı. Lütfen seed işlemini tekrar çalıştırın.');
          }

          productId = muhtelifProduct.id;
          product = muhtelifProduct;
        } else {
          // Normal ürün için ürünü getir
          product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new Error(`Ürün bulunamadı: ${item.productId}`);
          }
        }

        // Satış kalemi oluştur
        await tx.saleItem.create({
          data: {
            saleId: createdSale.id,
            productId: productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            discount: 0,
            total: item.unitPrice * item.quantity,
          },
        });

        // Muhtelif item'lar için stok düşürme ve stok hareketi oluşturma
        if (!isMuhtelifItem) {
          // Stok düş
          await tx.product.update({
            where: { id: productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });

          // Stok hareketi oluştur
          await tx.stockMovement.create({
            data: {
              productId: productId,
              type: 'OUT',
              quantity: item.quantity,
              previousStock: product!.stock,
              newStock: product!.stock - item.quantity,
              referenceType: 'SALE',
              referenceId: createdSale.id,
              notes: `Satış - Fiş No: ${saleNumber}`,
              userId: req.userId!,
            },
          });
        }
      }

      // Veresiye satışta müşteri borcunu artır
      if (paymentMethod === 'CREDIT' && customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            debt: {
              increment: total,
            },
          },
        });
      }

      return createdSale;
    });

    // Satışı tekrar getir (ilişkilerle birlikte)
    const formattedSale = await prisma.sale.findUnique({
      where: { id: sale.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

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

// 💠 ENTERPRISE: Get sale by receipt number
export const getSaleByReceipt = async (req: Request, res: Response) => {
  try {
    const { receiptNumber } = req.params;

    const sale = await prisma.sale.findFirst({
      where: { saleNumber: receiptNumber },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                barcode: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Fiş bulunamadı' });
    }

    // Format items for frontend
    const formattedSale = {
      ...sale,
      receiptNumber: sale.saleNumber,
      items: sale.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        barcode: item.product.barcode,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.unitPrice,
        total: item.total,
      })),
    };

    res.json(formattedSale);
  } catch (error) {
    console.error('Get sale by receipt error:', error);
    res.status(500).json({ error: 'Fiş getirilemedi' });
  }
};

// 💠 ENTERPRISE: Search sales by date range
export const searchSales = async (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({ error: 'Başlangıç ve bitiş tarihleri gereklidir' });
    }

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: new Date(dateFrom as string),
          lte: new Date(dateTo as string + 'T23:59:59.999Z'),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                barcode: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format items for frontend
    const formattedSales = sales.map((sale) => ({
      ...sale,
      receiptNumber: sale.saleNumber,
      items: sale.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        barcode: item.product.barcode,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.unitPrice,
        total: item.total,
      })),
    }));

    res.json(formattedSales);
  } catch (error) {
    console.error('Search sales error:', error);
    res.status(500).json({ error: 'Satışlar getirilemedi' });
  }
};

// 💠 ENTERPRISE: Process sale return/refund
export const processSaleReturn = async (req: AuthRequest, res: Response) => {
  try {
    const { saleId, items } = req.body;

    if (!saleId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Geçersiz iade bilgileri' });
    }

    // Get original sale
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Satış bulunamadı' });
    }

    let returnTotal = 0;

    await prisma.$transaction(async (tx) => {
      // Process each return item
      for (const returnItem of items) {
        const originalItem = sale.items.find((item) => item.id === returnItem.saleItemId);

        if (!originalItem) {
          throw new Error(`Satış kalemi bulunamadı: ${returnItem.saleItemId}`);
        }

        if (returnItem.quantity > originalItem.quantity) {
          throw new Error(`İade miktarı orijinal miktardan fazla olamaz: ${originalItem.productId}`);
        }

        // Calculate return amount
        const returnAmount = originalItem.unitPrice * returnItem.quantity;
        returnTotal += returnAmount;

        // Get current product stock
        const product = await tx.product.findUnique({
          where: { id: originalItem.productId },
          select: { stock: true },
        });

        if (!product) {
          throw new Error(`Ürün bulunamadı: ${originalItem.productId}`);
        }

        const previousStock = product.stock;
        const newStock = previousStock + returnItem.quantity;

        // Update product stock (add back returned items)
        await tx.product.update({
          where: { id: originalItem.productId },
          data: {
            stock: newStock,
          },
        });

        // Create stock movement record
        await tx.stockMovement.create({
          data: {
            productId: originalItem.productId,
            quantity: returnItem.quantity,
            previousStock,
            newStock,
            type: 'RETURN',
            referenceType: 'RETURN',
            referenceId: saleId,
            notes: `İade - Fiş No: ${sale.saleNumber}`,
            userId: req.userId || sale.userId,
          },
        });

        // Update or delete sale item
        if (returnItem.quantity === originalItem.quantity) {
          // Full return - delete the item
          await tx.saleItem.delete({
            where: { id: originalItem.id },
          });
        } else {
          // Partial return - update the quantity and total
          const newQuantity = originalItem.quantity - returnItem.quantity;
          const newTotal = originalItem.unitPrice * newQuantity;
          await tx.saleItem.update({
            where: { id: originalItem.id },
            data: {
              quantity: newQuantity,
              total: newTotal,
            },
          });
        }
      }

      // Update sale total
      const remainingItems = await tx.saleItem.findMany({
        where: { saleId },
      });

      if (remainingItems.length === 0) {
        // Full return - delete the sale
        await tx.sale.delete({
          where: { id: saleId },
        });
      } else {
        // Partial return - update the total
        const newTotal = remainingItems.reduce((sum, item) => sum + item.total, 0);
        await tx.sale.update({
          where: { id: saleId },
          data: {
            total: newTotal,
          },
        });
      }

      // If customer exists and payment was credit, adjust debt
      if (sale.customer && sale.paymentMethod === 'CREDIT') {
        await tx.customer.update({
          where: { id: sale.customerId! },
          data: {
            debt: {
              decrement: returnTotal,
            },
          },
        });
      }
    });

    res.json({
      message: 'İade işlemi başarıyla tamamlandı',
      returnTotal,
    });
  } catch (error: any) {
    console.error('Process sale return error:', error);
    res.status(500).json({ error: error.message || 'İade işlemi başarısız' });
  }
};
