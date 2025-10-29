import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';

export const getCashTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { shiftId } = req.query;
    
    const where: any = {};
    if (shiftId) {
      where.shiftId = shiftId as string;
    }

    const transactions = await prisma.cashTransaction.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        shift: { select: { id: true, shiftNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ transactions });
  } catch (error) {
    console.error('Get cash transactions error:', error);
    res.status(500).json({ error: 'Nakit işlemleri getirilemedi' });
  }
};

export const addCashTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Kullanıcı kimliği bulunamadı' });
    }

    const { shiftId, type, amount, category, note } = req.body;

    // Validate shift exists and is open
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      return res.status(404).json({ error: 'Vardiya bulunamadı' });
    }

    if (shift.status !== 'OPEN') {
      return res.status(400).json({ error: 'Sadece açık vardiyalara işlem eklenebilir' });
    }

    // Create transaction
    const transaction = await prisma.cashTransaction.create({
      data: {
        shiftId,
        type,
        amount: parseFloat(amount),
        category: category || 'OTHER',
        note,
        userId,
      },
      include: {
        user: { select: { id: true, name: true } },
        shift: { select: { id: true, shiftNumber: true } },
      },
    });

    res.json({ transaction, message: 'Nakit işlemi başarıyla eklendi' });
  } catch (error) {
    console.error('Add cash transaction error:', error);
    res.status(500).json({ error: 'Nakit işlemi eklenemedi' });
  }
};

export const getCurrentCashBalance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    // Get active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        userId,
        status: 'OPEN',
      },
      include: {
        sales: { select: { total: true, paymentMethod: true, paymentDetails: true } },
        cashTransactions: true,
      },
    });

    if (!activeShift) {
      return res.json({ balance: 0, hasActiveShift: false });
    }

    // Calculate cash from sales
    const cashFromSales = activeShift.sales.reduce((sum, sale) => {
      if (sale.paymentMethod === 'CASH') {
        return sum + sale.total;
      } else if (sale.paymentMethod === 'MIXED' && sale.paymentDetails) {
        try {
          const details = JSON.parse(sale.paymentDetails);
          return sum + (details.cash || 0);
        } catch {
          return sum;
        }
      }
      return sum;
    }, 0);

    // Calculate cash transactions
    const cashIn = activeShift.cashTransactions
      .filter(t => t.type === 'IN')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const cashOut = activeShift.cashTransactions
      .filter(t => t.type === 'OUT')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = activeShift.startCash + cashFromSales + cashIn - cashOut;

    res.json({ 
      balance,
      hasActiveShift: true,
      shift: {
        id: activeShift.id,
        shiftNumber: activeShift.shiftNumber,
        startCash: activeShift.startCash,
        startTime: activeShift.startTime,
      },
    });
  } catch (error) {
    console.error('Get cash balance error:', error);
    res.status(500).json({ error: 'Kasa bakiyesi getirilemedi' });
  }
};

export const deleteCashTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const transaction = await prisma.cashTransaction.findUnique({
      where: { id },
      include: { shift: true },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'İşlem bulunamadı' });
    }

    if (transaction.shift.status !== 'OPEN') {
      return res.status(400).json({ error: 'Kapalı vardiyadan işlem silinemez' });
    }

    if (transaction.category === 'INITIAL') {
      return res.status(400).json({ error: 'Başlangıç kasası işlemi silinemez' });
    }

    await prisma.cashTransaction.delete({
      where: { id },
    });

    res.json({ message: 'İşlem başarıyla silindi' });
  } catch (error) {
    console.error('Delete cash transaction error:', error);
    res.status(500).json({ error: 'İşlem silinemedi' });
  }
};

