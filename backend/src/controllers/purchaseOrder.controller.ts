import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

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

export const createPurchaseOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { supplierId, items, expectedDate, notes } = req.body;

    if (!supplierId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Tedarikçi ve ürünler gereklidir' });
    }

    // Validate supplier exists
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) {
      return res.status(404).json({ error: 'Tedarikçi bulunamadı' });
    }

    // Calculate total
    let totalAmount = 0;
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.unitCost) {
        return res.status(400).json({ error: 'Tüm ürün bilgileri gereklidir' });
      }
      totalAmount += item.quantity * item.unitCost;
    }

    // Generate order number
    const orderCount = await prisma.purchaseOrder.count();
    const orderNumber = `PO-${new Date().getFullYear()}-${String(orderCount + 1).padStart(6, '0')}`;

    // Create purchase order
    const order = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId,
        totalAmount,
        paidAmount: 0,
        status: 'PENDING',
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            total: item.quantity * item.unitCost,
            receivedQty: 0,
          })),
        },
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });

    res.status(201).json({ order, message: 'Satın alma siparişi oluşturuldu' });
  } catch (error: any) {
    console.error('Create purchase order error:', error);
    res.status(500).json({ error: error.message || 'Satın alma siparişi oluşturulamadı' });
  }
};

export const updatePurchaseOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'APPROVED', 'RECEIVED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Geçersiz durum' });
    }

    const updateData: any = { status };

    if (status === 'RECEIVED') {
      updateData.receivedDate = new Date();
    }

    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });

    res.json({ order, message: 'Sipariş durumu güncellendi' });
  } catch (error: any) {
    console.error('Update purchase order status error:', error);
    res.status(500).json({ error: error.message || 'Sipariş durumu güncellenemedi' });
  }
};

export const receivePurchaseOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { items } = req.body; // items: [{ itemId, receivedQty }]

    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }

    if (order.status === 'CANCELLED') {
      return res.status(400).json({ error: 'İptal edilmiş sipariş teslim alınamaz' });
    }

    // Update each item and stock
    for (const receivedItem of items) {
      const orderItem = order.items.find(i => i.id === receivedItem.itemId);
      if (!orderItem) continue;

      const newReceivedQty = (orderItem.receivedQty || 0) + receivedItem.receivedQty;

      // Update order item
      await prisma.purchaseOrderItem.update({
        where: { id: receivedItem.itemId },
        data: { receivedQty: newReceivedQty },
      });

      // Update product stock
      await prisma.product.update({
        where: { id: orderItem.productId },
        data: {
          stock: {
            increment: receivedItem.receivedQty,
          },
        },
      });

      // Create stock movement
      await prisma.stockMovement.create({
        data: {
          productId: orderItem.productId,
          type: 'IN',
          quantity: receivedItem.receivedQty,
          previousStock: orderItem.product.stock,
          newStock: orderItem.product.stock + receivedItem.receivedQty,
          referenceType: 'PURCHASE',
          referenceId: order.id,
          notes: `Satın alma siparişi teslim alındı: ${order.orderNumber}`,
          userId: req.user!.id,
        },
      });
    }

    // Check if all items fully received
    const updatedOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    const allReceived = updatedOrder!.items.every(
      item => item.receivedQty >= item.quantity
    );

    if (allReceived) {
      await prisma.purchaseOrder.update({
        where: { id },
        data: {
          status: 'RECEIVED',
          receivedDate: new Date(),
        },
      });
    }

    const finalOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });

    res.json({ order: finalOrder, message: 'Ürünler teslim alındı ve stok güncellendi' });
  } catch (error: any) {
    console.error('Receive purchase order error:', error);
    res.status(500).json({ error: error.message || 'Ürünler teslim alınamadı' });
  }
};

export const deletePurchaseOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }

    if (order.status === 'RECEIVED') {
      return res.status(400).json({ error: 'Teslim alınmış sipariş silinemez' });
    }

    await prisma.purchaseOrder.delete({ where: { id } });

    res.json({ message: 'Satın alma siparişi silindi' });
  } catch (error: any) {
    console.error('Delete purchase order error:', error);
    res.status(500).json({ error: error.message || 'Sipariş silinemedi' });
  }
};
