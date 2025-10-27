import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        sale: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ invoices });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Faturalar getirilemedi' });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        sale: { include: { items: { include: { product: true } } } },
        customer: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Fatura bulunamadı' });
    }

    res.json({ invoice });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Fatura getirilemedi' });
  }
};




