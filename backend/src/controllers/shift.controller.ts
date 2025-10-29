import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';

export const getAllShifts = async (req: Request, res: Response) => {
  try {
    const shifts = await prisma.shift.findMany({
      include: {
        user: { select: { id: true, name: true } },
        sales: { select: { id: true, total: true } },
        cashTransactions: true,
        _count: { select: { sales: true } },
      },
      orderBy: { startTime: 'desc' },
    });
    res.json({ shifts });
  } catch (error) {
    console.error('Get shifts error:', error);
    res.status(500).json({ error: 'Vardiyalar getirilemedi' });
  }
};

export const getActiveShift = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    const activeShift = await prisma.shift.findFirst({
      where: {
        userId,
        status: 'OPEN',
      },
      include: {
        user: { select: { id: true, name: true } },
        sales: { select: { id: true, total: true, paymentMethod: true } },
        cashTransactions: { orderBy: { createdAt: 'desc' } },
        _count: { select: { sales: true } },
      },
    });

    res.json({ activeShift });
  } catch (error) {
    console.error('Get active shift error:', error);
    res.status(500).json({ error: 'Aktif vardiya getirilemedi' });
  }
};

export const getShiftById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        sales: { include: { items: true, customer: true } },
        cashTransactions: { orderBy: { createdAt: 'asc' } },
        _count: { select: { sales: true } },
      },
    });

    if (!shift) {
      return res.status(404).json({ error: 'Vardiya bulunamadı' });
    }

    res.json({ shift });
  } catch (error) {
    console.error('Get shift error:', error);
    res.status(500).json({ error: 'Vardiya getirilemedi' });
  }
};

export const startShift = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Kullanıcı kimliği bulunamadı' });
    }

    const { startCash, branchId } = req.body;

    // Check if user already has an open shift
    const existingShift = await prisma.shift.findFirst({
      where: {
        userId,
        status: 'OPEN',
      },
    });

    if (existingShift) {
      return res.status(400).json({ error: 'Zaten açık bir vardiyınız var' });
    }

    // Get last shift number
    const lastShift = await prisma.shift.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    const shiftNumber = lastShift
      ? `SHIFT-${String(parseInt(lastShift.shiftNumber.split('-')[1]) + 1).padStart(6, '0')}`
      : 'SHIFT-000001';

    // Create shift with initial cash transaction
    const shift = await prisma.shift.create({
      data: {
        shiftNumber,
        userId,
        branchId,
        startTime: new Date(),
        startCash: parseFloat(startCash) || 0,
        status: 'OPEN',
        cashTransactions: {
          create: {
            type: 'IN',
            amount: parseFloat(startCash) || 0,
            category: 'INITIAL',
            note: 'Vardiya başlangıç kasası',
            userId,
          },
        },
      },
      include: {
        user: { select: { id: true, name: true } },
        cashTransactions: true,
      },
    });

    res.json({ shift, message: 'Vardiya başarıyla başlatıldı' });
  } catch (error) {
    console.error('Start shift error:', error);
    res.status(500).json({ error: 'Vardiya başlatılamadı' });
  }
};

export const endShift = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { actualCash, notes } = req.body;

    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        sales: true,
        cashTransactions: true,
      },
    });

    if (!shift) {
      return res.status(404).json({ error: 'Vardiya bulunamadı' });
    }

    if (shift.userId !== userId) {
      return res.status(403).json({ error: 'Bu vardiyayı kapatma yetkiniz yok' });
    }

    if (shift.status !== 'OPEN') {
      return res.status(400).json({ error: 'Bu vardiya zaten kapalı' });
    }

    // Calculate expected cash
    const cashSales = shift.sales.filter(s => s.paymentMethod === 'CASH' || s.paymentMethod === 'MIXED');
    const totalCashFromSales = cashSales.reduce((sum, sale) => {
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

    const cashIn = shift.cashTransactions
      .filter(t => t.type === 'IN')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const cashOut = shift.cashTransactions
      .filter(t => t.type === 'OUT')
      .reduce((sum, t) => sum + t.amount, 0);

    const expectedCash = shift.startCash + totalCashFromSales + cashIn - cashOut;
    const actualCashValue = parseFloat(actualCash);
    const difference = actualCashValue - expectedCash;

    // Update shift
    const updatedShift = await prisma.shift.update({
      where: { id },
      data: {
        endTime: new Date(),
        endCash: actualCashValue,
        expectedCash,
        actualCash: actualCashValue,
        difference,
        status: 'CLOSED',
        notes,
      },
      include: {
        user: { select: { id: true, name: true } },
        sales: true,
        cashTransactions: true,
        _count: { select: { sales: true } },
      },
    });

    res.json({ shift: updatedShift, message: 'Vardiya başarıyla kapatıldı' });
  } catch (error) {
    console.error('End shift error:', error);
    res.status(500).json({ error: 'Vardiya kapatılamadı' });
  }
};




