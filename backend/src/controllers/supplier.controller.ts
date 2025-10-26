import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllSuppliers = async (req: Request, res: Response) => {
  try {
    const { search, isActive } = req.query;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } },
        { phone: { contains: search as string } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        _count: {
          select: { purchaseOrders: true, payments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ suppliers });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Tedarikçiler getirilemedi' });
  }
};

export const getSupplierById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Tedarikçi bulunamadı' });
    }

    res.json({ supplier });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ error: 'Tedarikçi getirilemedi' });
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const { name, contactPerson, email, phone, address, taxNumber, paymentTerms, notes } = req.body;

    if (email) {
      const existing = await prisma.supplier.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: 'Bu email zaten kullanılıyor' });
      }
    }

    const supplier = await prisma.supplier.create({
      data: { name, contactPerson, email, phone, address, taxNumber, paymentTerms, notes },
    });

    res.status(201).json({ message: 'Tedarikçi oluşturuldu', supplier });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ error: 'Tedarikçi oluşturulamadı' });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, contactPerson, email, phone, address, taxNumber, paymentTerms, notes, isActive } = req.body;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { name, contactPerson, email, phone, address, taxNumber, paymentTerms, notes, isActive },
    });

    res.json({ message: 'Tedarikçi güncellendi', supplier });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ error: 'Tedarikçi güncellenemedi' });
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.supplier.delete({ where: { id } });
    res.json({ message: 'Tedarikçi silindi' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ error: 'Tedarikçi silinemedi' });
  }
};


