import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

// Müşteri Detayı
export const getCustomerDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        debts: {
          include: {
            payments: true,
            user: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        transactions: {
          include: {
            user: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        notes: {
          include: {
            user: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          include: {
            user: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Müşteri bulunamadı' });
    }

    res.json({ customer });
  } catch (error) {
    console.error('Get customer detail error:', error);
    res.status(500).json({ error: 'Müşteri detayı getirilemedi' });
  }
};

// Borç Ekle
export const addDebt = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, description, dueDate } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Geçerli bir tutar girin' });
    }

    const debt = await prisma.customerDebt.create({
      data: {
        customerId: id,
        amount,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: req.user!.id,
      },
    });

    // Müşterinin borç tutarını güncelle
    await prisma.customer.update({
      where: { id },
      data: {
        debt: {
          increment: amount,
        },
      },
    });

    // İşlem geçmişine ekle
    await prisma.customerTransaction.create({
      data: {
        customerId: id,
        type: 'DEBT',
        amount,
        description: description || 'Borç eklendi',
        referenceType: 'Debt',
        referenceId: debt.id,
        userId: req.user!.id,
      },
    });

    res.status(201).json({ debt, message: 'Borç eklendi' });
  } catch (error) {
    console.error('Add debt error:', error);
    res.status(500).json({ error: 'Borç eklenemedi' });
  }
};

// Ödeme Al
export const addPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Geçerli bir tutar girin' });
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ error: 'Müşteri bulunamadı' });
    }

    if (amount > customer.debt) {
      return res.status(400).json({ error: 'Ödeme tutarı borçtan fazla olamaz' });
    }

    // Açık borçları bul
    const openDebts = await prisma.customerDebt.findMany({
      where: {
        customerId: id,
        status: { in: ['OPEN', 'PARTIAL'] },
      },
      orderBy: { createdAt: 'asc' },
    });

    let remainingAmount = amount;

    // Borçları sırayla öde
    for (const debt of openDebts) {
      if (remainingAmount <= 0) break;

      const debtRemaining = debt.amount - debt.paidAmount;
      const paymentForThisDebt = Math.min(remainingAmount, debtRemaining);

      // Ödeme kaydı oluştur
      await prisma.debtPayment.create({
        data: {
          debtId: debt.id,
          amount: paymentForThisDebt,
          paymentMethod,
          notes,
          userId: req.user!.id,
        },
      });

      // Borcu güncelle
      const newPaidAmount = debt.paidAmount + paymentForThisDebt;
      const newStatus = newPaidAmount >= debt.amount ? 'PAID' : 'PARTIAL';

      await prisma.customerDebt.update({
        where: { id: debt.id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          paidDate: newStatus === 'PAID' ? new Date() : null,
        },
      });

      remainingAmount -= paymentForThisDebt;
    }

    // Müşterinin borç tutarını güncelle
    await prisma.customer.update({
      where: { id },
      data: {
        debt: {
          decrement: amount,
        },
      },
    });

    // İşlem geçmişine ekle
    await prisma.customerTransaction.create({
      data: {
        customerId: id,
        type: 'PAYMENT',
        amount: -amount,
        description: notes || 'Ödeme alındı',
        referenceType: 'Payment',
        userId: req.user!.id,
      },
    });

    res.json({ message: 'Ödeme alındı', paidAmount: amount });
  } catch (error) {
    console.error('Add payment error:', error);
    res.status(500).json({ error: 'Ödeme alınamadı' });
  }
};

// İşlem Geçmişi
export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { type, startDate, endDate } = req.query;

    const where: any = { customerId: id };

    if (type && type !== 'all') {
      where.type = type;
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const transactions = await prisma.customerTransaction.findMany({
      where,
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'İşlem geçmişi getirilemedi' });
  }
};

// Not Ekle
export const addNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { note, isPinned } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ error: 'Not boş olamaz' });
    }

    const customerNote = await prisma.customerNote.create({
      data: {
        customerId: id,
        note,
        isPinned: isPinned || false,
        userId: req.user!.id,
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    res.status(201).json({ note: customerNote, message: 'Not eklendi' });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ error: 'Not eklenemedi' });
  }
};

// Notları Getir
export const getNotes = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const notes = await prisma.customerNote.findMany({
      where: { customerId: id },
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({ notes });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Notlar getirilemedi' });
  }
};

// Not Sil
export const deleteNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id, noteId } = req.params;

    await prisma.customerNote.delete({
      where: { id: noteId },
    });

    res.json({ message: 'Not silindi' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Not silinemedi' });
  }
};

// Borç Sil
export const deleteDebt = async (req: AuthRequest, res: Response) => {
  try {
    const { id, debtId } = req.params;

    // Önce borcu bul
    const debt = await prisma.customerDebt.findUnique({
      where: { id: debtId },
    });

    if (!debt) {
      return res.status(404).json({ error: 'Borç bulunamadı' });
    }

    // Eğer ödeme yapılmışsa silme
    if (debt.paidAmount > 0) {
      return res.status(400).json({ error: 'Ödeme yapılmış borç silinemez' });
    }

    // Borcu sil
    await prisma.customerDebt.delete({
      where: { id: debtId },
    });

    // Müşterinin borç tutarını güncelle
    await prisma.customer.update({
      where: { id },
      data: {
        debt: {
          decrement: debt.amount,
        },
      },
    });

    // İşlem kaydını sil (varsa)
    await prisma.customerTransaction.deleteMany({
      where: {
        customerId: id,
        referenceType: 'Debt',
        referenceId: debtId,
      },
    });

    res.json({ message: 'Borç silindi' });
  } catch (error) {
    console.error('Delete debt error:', error);
    res.status(500).json({ error: 'Borç silinemedi' });
  }
};

// Finansal Özet
export const getFinancialSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        debts: true,
        sales: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Müşteri bulunamadı' });
    }

    const totalDebt = customer.debt;
    const totalPaid = customer.debts.reduce((sum, debt) => sum + debt.paidAmount, 0);
    const openDebts = customer.debts.filter(d => d.status !== 'PAID').length;
    const overdueDebts = customer.debts.filter(
      d => d.status !== 'PAID' && d.dueDate && new Date(d.dueDate) < new Date()
    ).length;

    res.json({
      totalSpent: customer.totalSpent,
      totalDebt,
      totalPaid,
      remainingDebt: totalDebt - totalPaid,
      openDebtsCount: openDebts,
      overdueDebtsCount: overdueDebts,
      totalSales: customer.sales.length,
      loyaltyPoints: customer.loyaltyPoints,
    });
  } catch (error) {
    console.error('Get financial summary error:', error);
    res.status(500).json({ error: 'Finansal özet getirilemedi' });
  }
};

