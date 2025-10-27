import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllShifts = async (req: Request, res: Response) => {
  try {
    const shifts = await prisma.shift.findMany({
      include: {
        user: { select: { id: true, name: true } },
        sales: { select: { id: true, totalAmount: true } },
      },
      orderBy: { startTime: 'desc' },
    });
    res.json({ shifts });
  } catch (error) {
    console.error('Get shifts error:', error);
    res.status(500).json({ error: 'Vardiyalar getirilemedi' });
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
        cashTransactions: true,
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




