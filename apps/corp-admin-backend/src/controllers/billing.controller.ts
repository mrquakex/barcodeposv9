import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { CorpAuthRequest } from '../middleware/auth.middleware.js';

export const getInvoices = async (req: CorpAuthRequest, res: Response) => {
  try {
    const invoices = await prisma.paymentReceipt.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: {
          select: { id: true, name: true },
        },
      },
    });

    res.json({ invoices });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

export const createInvoice = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { tenantId, amount, currency, notes } = req.body;
    const invoice = await prisma.paymentReceipt.create({
      data: {
        tenantId,
        amount,
        currency: currency || 'TRY',
        notes,
        status: 'PENDING',
      },
    });

    res.status(201).json({ invoice });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

export const getPayments = async (req: CorpAuthRequest, res: Response) => {
  try {
    const payments = await prisma.paymentReceipt.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: {
          select: { id: true, name: true },
        },
      },
    });

    res.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

